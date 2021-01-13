class Matcher {
  constructor(options = {}) {
    this.options = options;

    this.itemPlaceholder = [...options.placeholders].find(el => el.id === 'item-placeholder');
    this.candidatesPlaceholder = [...options.placeholders].find(el => el.id === 'candidates-placeholder');

    this.itemContainer = [...options.containers].find(el => el.id === 'item-container');
    this.candidatesContainer = [...options.containers].find(el => el.id === 'candidates-container');

    this.selectedCandidates = [];

    this.navbarPlaceholder = `
      <div class="navbar-placeholder">
        <div class="ui placeholder small-button-placeholder">
          <div class="image"></div>
        </div>
      </div>
      <div class="navbar-placeholder">
        <div class="ui placeholder button-placeholder">
          <div class="image"></div>
        </div>
      </div>
    `;

    if (!options.alias) {
      console.error('[Matcher] Missing Job Alias - aborting setup');
      return;
    }

    if (!options.job_type) {
      console.warn('[Matcher] Missing Job Type - defaults to "main"');
    }

    this.singleItem = Boolean(options.uriQueryString);
    this.getItemURL = `/api/v2/item/${options.alias}${options.uriQueryString ? `?uri=${options.uriQueryString}` : ''}`;

  }

  /**
   * @method init gets templates and first (or only, if sigle) item
   */
  init() {
    return new Promise(async (resolve, reject) => {
      try {
        // load templates
        this.navbarTemplate = await getText(`/views/template/match-navbar.html`);
        this.itemTemplate = await getText(`/views/template/${this.options.job_type || 'main'}/item.html`);
        this.candidateTemplate = await getText(`/views/template/${this.options.job_type || 'main'}/candidate.html`);
        this.createTemplate = await getText(`/views/template/${this.options.job_type || 'main'}/create.html`);     
        // get first item
        this.next(true)
          .then(item => resolve(item))
          .catch(err => {reject(err)});
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  }

  next(first) {
    return new Promise((resolve, reject) => {

      this.selectedCandidates = [];

      // if (this.singleItem && !first) {
      //   console.warn("[Matcher] There's no next in a single item page");
      //   return reject({ error: 'single-item-no-next' });
      // }

      const url = first ? this.getItemURL : `/api/v2/item/${this.options.alias}`;

      getJSON(url)
        .then(async item => {
          this.updateBrowserHistory(item.item_uri);
          await this.render(item, this.options);
          resolve(item);      
        }).catch(async err => {
          if (err.status === 404) {
            await this.renderNoItems();
          }
          reject(err);
        });
    });
  }

  updateBrowserHistory(itemUri) {
    const newUrl = `/match/${this.options.alias}?uri=${encodeURIComponent(itemUri)}`;
    window.history.replaceState({
      urlPath: newUrl
    }, 'OLAF | Match', newUrl);
  }

  removeItem(item_id) {
    return new Promise(async (resolve, reject) => {
      await this.showPlaceholders();
      postJSON(`/api/v2/item/${this.options.alias}/${item_id}/remove`)
        .then(async res => {
          await this.next(false);
        }).catch(err => {
          console.error(err);
        });
    });
  }

  skipItem(item_id) {
    return new Promise(async (resolve, reject) => {
      await this.showPlaceholders();
      postJSON(`/api/v2/item/${this.options.alias}/${item_id}/skip`)
        .then(async res => {
          await this.next(false);
        }).catch(err => {
          console.error(err);
        });
    });
  }

  confirmMatch(item_id, candidates) {
    return new Promise(async (resolve, reject) => {
      await this.showPlaceholders();
      postJSON(`/api/v2/item/${this.options.alias}/${item_id}`, candidates)
        .then(async res => {
          await this.next();
        }).catch(err => {
          console.error(err);
        });
    });
  }

  renderNoItems() {
    return new Promise(async (resolve, reject) => {
      const itemCol = document.querySelector('.item-column');
      itemCol.classList.add('d-none');
      this.renderNavbar({ task_finished: true })
      this.renderCandidates({}, { task_finished: true, alias: this.options.alias });
      await this.showContainers();
    });
  }

  render(data, options) {
    return new Promise(async (resolve, reject) => {
      try {
        this.currentItemId = data.item_id; 
        this.renderNavbar({ is_processed: data.is_processed, last_update: formatDateAndTime(data.last_update) });
        this.renderItem(data.item_body, data.is_processed);
        this.renderCandidates(data.Candidates, { is_processed: data.is_processed, createCandidate: options.createCandidate });
        if (options.createCandidate) {
          this.renderCreate(data.item_body);
        }
        await this.showContainers();
        resolve();
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  }

  renderNavbar(options = {}) {
    this.options.navbarContainer.innerHTML = Mustache.render(this.navbarTemplate, {
      ...options,
      item_id            : this.currentItemId,
      singleItem         : this.singleItem,
      alias              : this.options.alias,
      job_name           : this.options.job_name,
      selectedCandidates : this.selectedCandidates
    });

    const infoButton = this.options.navbarContainer.querySelector('.info-button');
    if (infoButton) { 
      infoButton.addEventListener('click', e => $('.match-help-modal').modal('show'));
    }

    const removeButton = this.options.navbarContainer.querySelector('.remove-button');
    if (removeButton) {
      removeButton.addEventListener('click', e => {
        const item_id = e.target.dataset.item_id;
        this.removeItem(item_id);
      });
    }

    const skipButton = this.options.navbarContainer.querySelector('.skip-button');
    if (skipButton) {
      skipButton.addEventListener('click', e => {
        const item_id = e.target.dataset.item_id;
        this.skipItem(item_id);
      });
    }

    const confirmMatchButton = this.options.navbarContainer.querySelector('.confirm-match-button');
    if (confirmMatchButton) {
      confirmMatchButton.addEventListener('click', e => {
        const item_id = e.target.dataset.item_id;
        this.confirmMatch(item_id, this.selectedCandidates);
      });
    }

    const noMatchButton = this.options.navbarContainer.querySelector('.no-match-button');
    if (noMatchButton) {
      noMatchButton.addEventListener('click', e => {
        const item_id = e.target.dataset.item_id;
        this.confirmMatch(item_id, []);
      });
    }
  }

  renderItem(itemData, is_processed) {
    if (!this.itemTemplate) {
      console.error('[Matcher] Missing Item template - abording render');
      return;
    }

    const cleanData = Object.entries(this.options.fields).reduce((acc, curr) => {
      acc[curr[1].label] = itemData[curr[0]]
      return acc;
      }, {});

    // parse and clean data
    // const cleanData = this.objectKeysMap(itemData, key => key.replace(/ /g, '_'));
    this.itemContainer.innerHTML = Mustache.render(this.itemTemplate, { ...cleanData, is_processed });
  }

  renderCandidates(candidatesData, options = {}) {
    if (!this.candidateTemplate) {
      console.error('[Matcher] Missing Candidate template - abording render');
      return;
    }

    this.candidatesContainer.innerHTML = Mustache.render(this.candidateTemplate, { ...options, candidates: candidatesData });

    const selectItemButtons = this.candidatesContainer.querySelectorAll('.select-candidate-button');
    selectItemButtons.forEach(btn => btn.addEventListener('click', e => {

      const button = e.target;
      const candidate_id = button.dataset.candidate_id;

      if (button.classList.contains('selected')) {
        button.classList.remove('selected');
        this.selectedCandidates = this.selectedCandidates.filter(id => id !== candidate_id);
      } else {
        button.classList.add('selected');
        this.selectedCandidates.push(candidate_id);
      }

      this.renderNavbar();
    }));

    const createButton = document.getElementById('create-button');
    if (createButton) {
      createButton.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        $('#create-modal').modal('show');
      });
    }
  
  }

  renderCreate(itemData) {
    if (!this.createTemplate) {
      console.error('[Matcher] Missing Create template - abording render');
      return;
    }

    const cleanData = Object.entries(this.options.fields).reduce((acc, curr) => {
      if (curr[1].regex) {
        const re = new RegExp(curr[1].regex);
        acc[curr[1].label] = itemData[curr[0]].replace(re, "$1");
      } else {
        acc[curr[1].label] = itemData[curr[0]]
      }
      return acc;
    }, {});

    this.options.createContainer.innerHTML = Mustache.render(this.createTemplate, cleanData);

    $('#search-comune')
      .search({
        apiSettings: {
          url: '/api/v2/suggestion?q={query}'
        },
        fields: {
          title: 'titlesnippet',
          description: 'snippet'
        },
        minCharacters : 3,
        onSelect: function(res, resp) {
          $("input[name='candidate-located']").val(res.title);
        },
        onSearchQuery: function(query) {
          $("input[name='candidate-located']").val('');
        }
      });

    const typeData = Object.entries(this.options.fields).reduce((acc, curr) => {
      acc[curr[1].label] = curr[1].type
      return acc;
    }, {});

    const createQuickButton = document.getElementById('create-quickstatements-button');
    createQuickButton.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      let qsCode = 'CREATE';
      const label = $("input[name='candidate-label']").val();
      if (typeData['Nome'] && label) {
        qsCode += '||LAST|' + typeData['Nome'] + '|"' + label + '"';
      }
      const address = $("input[name='candidate-address']").val();
      if (typeData['Indirizzo'] && address) {
        qsCode += '||LAST|' + typeData['Indirizzo'] + '|"' + address + '"';
      }
      const located = $("input[name='candidate-located']").val();
      if (typeData['Comune'] && located) {
        qsCode += '||LAST|' + typeData['Comune'] + '|' + located;
      }
      const uri = $("input[name='candidate-uri']").val();
      if (typeData['URI'] && uri) {
        qsCode += '||LAST|' + typeData['URI'] + '|"' + uri + '"';
      }
      window.open('https://quickstatements.toolforge.org/#v1=' + encodeURIComponent(qsCode));
    });

    const createWikidataButton = document.getElementById('create-wikidata-button');
    createWikidataButton.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const label = $("input[name='candidate-label']").val();
      window.open('https://www.wikidata.org/w/index.php?title=Special:NewItem&lang=it&label=' + label);
    });

    const saveEntityButton = document.getElementById('save-entity-button');
    saveEntityButton.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
    });
  
  }

  objectMap(object, mapFn) {
    return Object.keys(object).reduce((result, key) => {
      result[key] = mapFn(object[key])
      return result;
    }, {});
  }

  objectKeysMap(object, mapFn) {
    return Object.keys(object).reduce((result, key) => {
      result[mapFn(key)] = object[key]
      return result;
    }, {});
  }

  showPlaceholders() {
    return new Promise(async (resolve, reject) => {
      try {
        // navbar
        this.options.navbarContainer.innerHTML = this.navbarPlaceholder;

        // item and candidates
        const t1 = startTransition(this.itemContainer, { duration: '300ms' });
        const t2 = startTransition(this.candidatesContainer, { duration: '300ms' });

        Promise.all([t1, t2]).then(() => {
          const t3 = startTransition(this.itemPlaceholder, { duration: '300ms' });
          const t4 = startTransition(this.candidatesPlaceholder, { duration: '300ms' });
          Promise.all([t3, t4]).then(() => resolve());
        });
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  }

  showContainers() {
    return new Promise(async (resolve, reject) => {
      try {
        // item and candidates
        const t1 = startTransition(this.itemPlaceholder, { duration: '300ms' });
        const t2 = startTransition(this.candidatesPlaceholder, { duration: '300ms' });

        Promise.all([t1, t2]).then(() => {
          const t3 = startTransition(this.itemContainer, { duration: '300ms' });
          const t4 = startTransition(this.candidatesContainer, { duration: '300ms' });
          Promise.all([t3, t4]).then(() => resolve());
        });
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  }
}