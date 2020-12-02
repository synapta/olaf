getJSON('/api/v2/job/_all').then(async jobs => {

  if (!Array.isArray(jobs)) {
    return;
  }

  const template = await getText('/views/template/jobs-list.html');

  const out = Mustache.render(template, { jobs: jobs.reverse() }); // most recent first

  const jobsContainer = document.getElementById('jobs');

  if (jobsContainer) jobsContainer.innerHTML = out;
});