const fakeJobs = [
  {
    name: 'Cool job',
    alias: 'cool_job',
    job_type: 'autori',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'
  },
  {
    name: 'Cool job 2',
    alias: 'cool_job_2',
    job_type: 'monumenti',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'
  },
  {
    name: 'Bad job',
    alias: 'bad_job',
    job_type: 'autori',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'
  },
  {
    name: 'Bad job 2',
    alias: 'bad_job_2',
    job_type: 'monumenti',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua'
  }
];

getJSON('/api/v2/job/_all').then(async jobs => {

  if (!Array.isArray(jobs)) {
    return;
  }

  const template = await getText('/views/template/jobs-list.html');

  const out = Mustache.render(template, { jobs: fakeJobs });

  const jobsContainer = document.getElementById('jobs');

  if (jobsContainer) jobsContainer.innerHTML = out;
});