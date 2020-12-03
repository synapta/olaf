const enrichJobInfo = info => {
  let type;
  let typeIcon;
  switch (info.job_type) {
    case 'monument':
      type = 'Monumenti';
      typeIcon = 'university';
      break;
    default:
      type = 'Autori';
      typeIcon = 'user';
      break;
  }

  const lastUpdate = formatDate(info.last_update);

  const hasSource = Boolean(Array.isArray(info.Source) && info.Source.length > 0);

  return { ...info, type, typeIcon, lastUpdate, hasSource };
};

const init = async () => {
  const id = getUrlParam(1);
  const jobInfo = await getJSON(`/api/v2/job/${id}`);

  const template = await getText('/views/template/job-body.html');

  const content = Mustache.render(template, enrichJobInfo(jobInfo));

  const jobContainer = document.getElementById('job-data');
  if (!jobContainer) {
    return;
  }

  jobContainer.innerHTML = content;

  const action = await startTransition('.job-placeholder');

  if (action !== 'hide') {
    return;
  }

  startTransition('#job-data');

  const jobLog = await getJSON(`/api/v2/log/${id}`);

  console.log(jobInfo);
  console.log('log', jobLog);
};

init();