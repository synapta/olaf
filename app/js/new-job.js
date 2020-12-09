const aliasRegex = new RegExp("^[a-z]+$");

const completeFirstStep = async e => {

  const submitButton = e.target.querySelector('button[type="submit"]');

  const name = e.target.querySelector('input[name="job-name"]').value;
  const aliasInput = e.target.querySelector('input[name="job-alias"]');
  const alias = aliasInput.value;


  if (!aliasRegex.test(alias)) {
    aliasInput.classList.add('wrong');
    e.target.querySelector('.alias-error').classList.add('d-block');
    return;
  }

  const description = e.target.querySelector('textarea[name="job-description"]').value;
  const job_type = e.target.querySelector('select[name="job-type"]').value;

  const job_config = {
    item_uri: e.target.querySelector('input[name="job-uri"]').value || 'URI',
    item_search: e.target.querySelector('input[name="job-search"]').value || 'Search'
  };

  toggleLoading(submitButton);

  try {
    const job = await createJob({ name, alias, description, job_type, job_config });

    // TODO - manage error when alias is already taken
  
    // setup second step form
    setupSecondStep(job.job_id);
  
    // hide first step
    const action = await startTransition('.new-job-step.step-1');
  
    // show second step
    if (action !== 'hide') {
      return;
    }
    
    await startTransition('.new-job-step.step-2');
  
    toggleLoading(submitButton);
  
    const newJobStep = document.getElementById('new-job-step');
    if (newJobStep) newJobStep.innerText = '2';
  } catch (error) {
    if (error.status === 400) {
      aliasInput.classList.add('wrong');
      e.target.querySelector('.alias-taken').classList.add('d-block');
    }
    toggleLoading(submitButton);
  }
};

const setupSecondStep = async job_id => {

  const formContainer = document.querySelector('.source-upload');
  if (!formContainer) {
    return;
  }

  const formTemplate = await getText('/views/template/source-form.html');
  const form = Mustache.render(formTemplate, { skipButton: true, classes: 'new-job-form' });

  formContainer.innerHTML = form;

  SourceForm.setup({ job_id, afterUpload: 'redirect' });
};

const init = () => {
  // bind submit forms
  const submitForms = document.querySelectorAll('.new-job-form');
  submitForms.forEach(form => form.addEventListener('submit', e => {
    e.preventDefault();
    const step = parseInt(e.target.dataset.step);
    if (step === 1) {
      completeFirstStep(e);
    }
  }));

  // alias error messages 
  const aliasInput = document.querySelector('input[name="job-alias"]');
  const aliasError = document.querySelector('.alias-error');
  const aliasTaken = document.querySelector('.alias-taken');
  aliasInput.addEventListener('click', e => {
    aliasInput.classList.remove('wrong');
    aliasError.classList.remove('d-block');
    aliasTaken.classList.remove('d-block');
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

