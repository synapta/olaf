const init = async () => {
  const userStatus = await USER.getStatus();
  console.log('user get status', userStatus);
};


// LOGIN
document.getElementById('login-form').addEventListener('submit', e => {
  e.preventDefault();
  e.stopPropagation();


  const inputs = [...e.target.querySelectorAll('input')].reduce((acc, curr) => {
    acc[curr.name] = curr.value;
    return acc;
  }, {});

  USER.login({
    email: inputs.email,
    password: inputs.password
  }).then(user => {
    if (user.redirect) {
      window.location.href = user.redirect;
    }
  }).catch(err => {
    console.error('login error', err);
    // TODO - show error message
  });
});

// SIGNUP
document.getElementById('signup-form').addEventListener('submit', e => {
  e.preventDefault();
  e.stopPropagation();

  // const inputs = [...e.target.querySelectorAll('input')].map(field => ({ name: field.name, value: field.value }));
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
    console.error('registration error', err);
    // TODO - show error message
  });
});