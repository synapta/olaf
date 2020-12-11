class Matcher {
  constructor(options = {}) {
    this.options = options;

    this.itemPlaceholder = [...options.placeholders].find(el => el.id === 'item-placeholder');
    this.candidatesPlaceholder = [...options.placeholders].find(el => el.id === 'candidates-placeholder');

    this.itemContainer = [...options.containers].find(el => el.id === 'item-container');
    this.candidatesContainer = [...options.containers].find(el => el.id === 'candidates-container');

    this.selectedCandidates = [];

    this.navbarPlacheolder = `
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
        // get first item
        this.next(true)
          .then(item => resolve(item))
          .catch(err => reject(err));
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

      getJSON(this.getItemURL)
        .then(async item => {
          this.updateBrowserHistory(item.item_uri);
          await this.render(item);
          resolve(item);      
        }).catch(err => reject(err));
    });
  }

  updateBrowserHistory(itemUri) {
    const newUrl = `/match/${this.options.alias}?uri=${encodeURIComponent(itemUri)}`;
    window.history.replaceState({
      urlPath: newUrl
    }, 'OLAF | Match', newUrl);
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

  render(data) {
    return new Promise(async (resolve, reject) => {
      try {
        this.currentItemId = data.item_id; 
        this.renderNavbar();
        this.renderItem(data.item_body);
        this.renderCandidates(data.Candidates);
        await this.showContainers();
        resolve();
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  }

  renderNavbar() {
    this.options.navbarContainer.innerHTML = Mustache.render(this.navbarTemplate, {
      item_id: this.currentItemId,
      singleItem: this.singleItem,
      alias: this.options.alias,      
      selectedCandidates: this.selectedCandidates
    });

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
  }

  renderItem(itemData) {
    if (!this.itemTemplate) {
      console.error('[Matcher] Missing Item template - abording render');
      return;
    }

    // parse and clean data
    const cleanData = this.objectKeysMap(itemData, key => key.replace(/ /g, '_'));
    this.itemContainer.innerHTML = Mustache.render(this.itemTemplate, cleanData);
  }

  renderCandidates(candidatesData) {
    if (!this.candidateTemplate) {
      console.error('[Matcher] Missing Candidate template - abording render');
      return;
    }

    this.candidatesContainer.innerHTML = Mustache.render(this.candidateTemplate, { candidates: candidatesData });

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
        this.options.navbarContainer.innerHTML = this.navbarPlacheolder;

        // item and candidates
        const t1 = startTransition(this.itemContainer);
        const t2 = startTransition(this.candidatesContainer);

        Promise.all([t1, t2]).then(() => {
          const t3 = startTransition(this.itemPlaceholder);
          const t4 = startTransition(this.candidatesPlaceholder);
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
        const t1 = startTransition(this.itemPlaceholder);
        const t2 = startTransition(this.candidatesPlaceholder);

        Promise.all([t1, t2]).then(() => {
          const t3 = startTransition(this.itemContainer);
          const t4 = startTransition(this.candidatesContainer);
          Promise.all([t3, t4]).then(() => resolve());
        });
      } catch (error) {
        console.error(error);
        reject(error);
      }
    });
  }
}