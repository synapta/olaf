const btn = document.querySelector('.new-verification');

btn.addEventListener('click', async e => {
  toggleLoading(e.target);
  [...document.querySelectorAll('.status-msg')].forEach(btn => btn.classList.add('d-none'));

  const user = await USER.getStatus();

  postJsonResText('/api/v2/user/verify', { email: user.getEmail() }).then(something => {
    const msg = document.querySelector('.status-msg.success');
    if (msg) msg.classList.remove('d-none');

    toggleLoading(e.target);

    const newToken = document.querySelector('.ask-new-token');
    if (newToken) newToken.classList.add('d-none');

  }).catch(err => {

    const msg = document.querySelector('.status-msg.negative');
    if (msg) msg.classList.remove('d-none');
    toggleLoading(e.target);
  });
});