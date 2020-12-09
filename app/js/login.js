// LOGIN
document.getElementById('login-form').addEventListener('submit', e => {
  e.preventDefault();
  e.stopPropagation();


  const inputs = [...e.target.querySelectorAll('input')].reduce((acc, curr) => {
    acc[curr.name] = curr.value;
    return acc;
  }, {});

  const submitBtn = e.target.querySelector('button[type="submit"]');
  toggleLoading(submitBtn);

  USER.login({
    email: inputs.email,
    password: inputs.password
  }).then(user => {
    if (user.redirect) {
      window.location.href = user.redirect;
    }
  }).catch(err => {
    const errMsg = e.target.querySelector('.negative.status-msg');
    if (errMsg) errMsg.classList.add('d-block');
    toggleLoading(submitBtn);
  });
});

// SIGNUP
document.getElementById('signup-form').addEventListener('submit', e => {
  e.preventDefault();
  e.stopPropagation();

  const inputs = [...e.target.querySelectorAll('input')].reduce((acc, curr) => {
    acc[curr.name] = curr.value;
    return acc;
  }, {});

  if (inputs.password !== inputs.retype_password ) {
    alert('Le password che hai inserito sono diverse!');
    // TODO better alert
    return;
  }

  USER.signup({
    email: inputs.email,
    display_name: inputs.display_name,
    password: inputs.password
  }).then(user => {
    if (user.redirect) {
      window.location.href = user.redirect;
    }
  }).catch(err => {
    const errMsg = e.target.querySelector('.negative.status-msg');
    if (errMsg) errMsg.classList.add('d-block');
    toggleLoading(submitBtn);
  });
});