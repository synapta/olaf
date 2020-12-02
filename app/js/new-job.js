const aliasRegex = new RegExp("^[a-z]+$");

const goToJobPage = job_id =>  window.location.href = `/job/${job_id}`;

const manageFileUpload = () => {
  const fileInput = document.getElementById('jobSourceFileInput');
  if (!fileInput) {
    return;
  }

  const fileInputError = document.querySelector('.file-error');
  if (!fileInputError) {
    return;
  }

  const uploadButton = document.querySelector('.upload-button');
  if (!uploadButton) {
    return;
  }

  fileInput.addEventListener ('change', e => {
    const fileType = e.target.files[0].type;

    if (fileType !== 'text/csv') {
      fileInput.classList.add('wrong');
      fileInputError.classList.add('d-block');
      uploadButton.classList.add('disabled');
    } else {
      fileInput.classList.remove('wrong');
      fileInputError.classList.remove('d-block');
      uploadButton.classList.remove('disabled');
    }
  }, false);
};

const completeJobCreation = async e => {
  
  const { job_id, job_alias } = e.target.dataset;
  const source_type = 'csv'; // TEMP - only allow csv

  const fileInput = document.getElementById('jobSourceFileInput');

  if (!fileInput) {
    return;
  }

  const file = fileInput.files[0];
  const buffer = await file.arrayBuffer();
  const path = await uploadFile(buffer);

  const uploadButton = document.querySelector('.upload-button');
  if (!uploadButton) {
    return;
  }

  const skipBtn =  document.querySelector('.skip-button');
  if (!skipBtn) {
    return;
  }

  const source_config = {
    path,
    separator : e.target.querySelector('input[name="job-source-separator"]').value || ',',
    quote     : e.target.querySelector('input[name="job-source-quote"]').value,
    escape    : e.target.querySelector('input[name="job-source-escape"]').value
  };

  uploadButton.classList.add('disabled', 'loading');
  skipBtn.classList.add('disabled');
  await createSource({ job_id, source_type, source_config });

  goToJobPage(job_id);
};


const completeFirstStep = async e => {

  const submitButton = e.target.querySelector('button[type="submit"]');

  const name = e.target.querySelector('input[name="job-name"]').value;
  const alias = e.target.querySelector('input[name="job-alias"]').value;

  if (!aliasRegex.test(alias)) {
    e.target.querySelector('input[name="job-alias"]').classList.add('wrong');
    e.target.querySelector('.alias-error').classList.add('d-block');
    return;
  }

  const description = e.target.querySelector('textarea[name="job-description"]').value;
  const job_type = e.target.querySelector('select[name="job-type"]').value;

  const job_config = {
    item_uri: e.target.querySelector('input[name="job-uri"]').value || 'URI',
    item_search: e.target.querySelector('input[name="job-search"]').value || 'Search'
  };

  submitButton.classList.add('disabled', 'loading');
  const job = await createJob({ name, alias, description, job_type, job_config });

  // TODO - manage error when alias is already taken

  // hide first step
  const action = await startTransition('.new-job-step.step-1');

  // show second step
  if (action !== 'hide') {
    return;
  }
  
  await startTransition('.new-job-step.step-2');

  submitButton.classList.remove('disabled', 'loading');

  const newJobStep = document.getElementById('new-job-step');
  if (newJobStep) newJobStep.innerText = '2';

  const secondStepForm = document.querySelector('.new-job-step.step-2 form.new-job-form');
  secondStepForm.dataset.job_id = job.job_id;
  secondStepForm.dataset.job_alias = alias;

  const skipBtn =  document.querySelector('.skip-button');
  if (skipBtn) skipBtn.dataset.job_id = job.job_id;
};

const init = () => {
  // bind submit forms
  const submitForms = document.querySelectorAll('.new-job-form');
  submitForms.forEach(form => form.addEventListener('submit', e => {

    e.preventDefault();

    const step = parseInt(e.target.dataset.step);

    if (step === 1) {
      completeFirstStep(e);
    } else if (step === 2) {
      completeJobCreation(e);
    }
  }));

  // bind back button
  const backBtns = document.querySelectorAll('.back-button');
  backBtns.forEach(btn => btn.addEventListener('click', async e => {
    const { stepcurrent, stepto } = e.target.dataset;
    const action = await startTransition(`.new-job-step.step-${stepcurrent}`);

    if (action !== 'hide') {
      return;
    }

    await startTransition(`.new-job-step.step-${stepto}`);
    const newJobStep = document.getElementById('new-job-step');
    if (newJobStep) newJobStep.innerText = stepto;
  }));

  // build CSV help modal
  buildCsvHelp();

  // manage file upload
  manageFileUpload();

  // bind skip button
  const skipBtn =  document.querySelector('.skip-button');
  skipBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    goToJobPage(e.target.dataset.job_id);
  });

  // alias error messages 
  const aliasInput = document.querySelector('input[name="job-alias"]');
  const aliasError = document.querySelector('.alias-error');
  aliasInput.addEventListener('click', e => {
    aliasInput.classList.remove('wrong');
    aliasError.classList.remove('d-block');
  });

  // get job types and show first form
  getJSON('/api/v2/job/_types').then(async types => {

    const options = types.map(type => createNode('option', { value: type.alias, innerText: type.description }));

    const select = document.getElementById('job-type-select');

    if (!select) {
      return;
    }

    // setup select
    options.forEach(el => select.appendChild(el));
    $('select.dropdown').dropdown();

    // hide placehoder
    const action = await startTransition('.new-job-placeholder');

    // show first step
    if (action === 'hide') { startTransition('.new-job-step.step-1'); }
  });
};

// go!
init();

