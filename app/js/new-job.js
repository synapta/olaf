const aliasRegex = new RegExp("^[a-z]+$");

const uploadFile = file => {
  return new Promise((resolve, reject) => {
    postCSV('/api/v2/upload', file)
    .then(res => resolve(res))
    .catch(err => reject(err));
  });
};

const createSource = source => {
  return new Promise((resolve, reject) => {
    postJSON('/api/v2/source', source)
      .then(res => resolve(res))
      .catch(err => reject(err));
  });
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
  const job_config = {};

  submitButton.classList.add('disabled', 'loading');
  const job = await createJob({ name, alias, description, job_type, job_config });

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
  secondStepForm.dataset.jobid = job.job_id;
};

const completeJobCreation = e => {
  console.log('complete job creation');
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

  // bind back buttons
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

