const createJob = async job => {
  const jobResponse = await postJSON('api/v2/job', { job });
};