const enrichJobInfo = (info, user) => {
  let type;
  let typeIcon;
  switch (info.job_type) {
    case 'monument':
      type = 'Monumenti';
      typeIcon = 'university';
      break;
    case 'author':
      type = 'Autori';
      typeIcon = 'user';
      break;
    default:
      type = 'Main';
      typeIcon = 'user';
      break;
  }

  const lastUpdate = formatDate(info.last_update);

  const hasSource = Boolean(Array.isArray(info.Sources) && info.Sources.length > 0);
  
  const sources = info.Sources.map(source => ({
    name: source.name,
    path: source.source_config.path.path,
    id  : source.source_id,
    type: source.source_type,
    icon: source.source_type === 'json' ? 'file code outline' : 'file alternate outline'
  }));

  return { ...info, type, typeIcon, lastUpdate, hasSource, sources, admin: user.isAdmin() };
};

const bindDeleteSourceInterface = () => {
  const confirmDel = document.querySelector('.confirm-delete-source');

  const cancelDel = document.querySelector('.cancel-delete-source');
  cancelDel.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    $('.delete-source-modal').modal('hide');
  });

  const delButtons = document.querySelectorAll('.delete-source-button');
  delButtons.forEach(btn => btn.addEventListener('click', e => {
    const source_id = e.target.dataset.source_id;
    $('.delete-source-modal').modal('show');   
    confirmDel.dataset.source_id = source_id;
  }));
  
  confirmDel.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    const source_id = e.target.dataset.source_id;
    e.target.classList.add('disabled', 'loading');

    // TODO - solve async issue - sometimes source_id is undefined
    
    deleteResource(`/api/v2/source/${source_id}`)
      .then(res => {
        location.reload();
      }).catch(err => {
        // TODO better alert "non è stato possibile eliminare la sorgente"
        alert("Non è stato possibile eliminare la sorgente");
        e.target.classList.remove('disabled', 'loading');
      });
  });
};

const addSourceForm = async (container, job_alias, job_id, hasSource) => {
  
  const formContainer = container.querySelector('.source-upload');
  if (!formContainer) {
    return;
  }

  const formTemplate = await getText('/views/template/source-form.html');
  const form = Mustache.render(formTemplate, { skipButton: false });

  formContainer.innerHTML = form;

  // if job already has a source, form comes into a closed accordion
  if (hasSource) { $('.ui.accordion.source-accordion').accordion(); }

  SourceForm.setup({ job_alias, job_id, afterUpload: 'reload' });
};

const init = async () => {
  const alias = getUrlParam(1);

  const user = await USER.getStatus();

  try {
    const jobInfo = await getJSON(`/api/v2/job/${alias}`);
    const enrichedInfo =  enrichJobInfo(jobInfo, user);
    
    const template = await getText('/views/template/job-body.html');
    const content = Mustache.render(template, enrichedInfo);
  
    const jobContainer = document.getElementById('job-data');
    if (!jobContainer) {
      return;
    }
  
    jobContainer.innerHTML = content;
  
    addSourceForm(jobContainer, alias, enrichedInfo.job_id, enrichedInfo.hasSource);
  
    const action = await startTransition('.job-placeholder');
  
    if (action !== 'hide') {
      return;
    }
  
    startTransition('#job-data');
  
    bindDeleteSourceInterface();


    if (user.isAdmin()) {
      const jobLog = await getJSON(`/api/v2/job/${alias}/log`);

      const logContainer = document.querySelector('.scheduler-log');

      if (!logContainer) {
        return;
      }

      if (Array.isArray(jobLog) && jobLog.length === 0) {
        logContainer.innerHTML = '<h4><i>nessun log disponibile</i></h4>';
        return;
      }

      const logTemplate = await getText('/views/template/job-log.html');

      const logContent = jobLog.map(log => {
        const out = Mustache.render(logTemplate, {
          ...log,
          time   : formatDateAndTime(log.timestamp).trim(),
          startLog: Boolean(log.description.status === 'start'),
          endLog: Boolean(log.description.status === 'end'),
          errorLog: Boolean(log.description.status === 'error')
        });
        return out;
      }).join('');

      logContainer.innerHTML = logContent;
    }

  } catch (error) {
    console.error(error);
    if (error.status === 404) {
      window.location.href = '/404';
    }    
  }
};

init();