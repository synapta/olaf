const init = async () => {
  const user = await USER.getStatus();

  if (user.status === 'anonymous') {
    document.body.classList.add('not-logged');
    return;
  } 

  document.body.classList.add('logged');

  if (user.isAdmin()) {
    document.querySelector('.admin-element').classList.remove('d-none');
  }

  const jobs = await getJSON('/api/v2/job/_all');

  if (!Array.isArray(jobs)) {
    return;
  }

  const template = await getText('/views/template/jobs-list.html');

  const out = Mustache.render(template, { jobs: jobs.reverse() }); // most recent first

  const jobsContainer = document.getElementById('jobs');

  if (jobsContainer) jobsContainer.innerHTML = out;
};

// go!
init();

