// intert mail to reset

const askReset = () => {
  const resetForm = document.getElementById('reset-password-form');

  resetForm.addEventListener('submit', e => {
    e.preventDefault();
    e.stopPropagation();

    [...e.target.querySelectorAll('.status-msg')].forEach(btn => btn.classList.remove('d-block'));
  
    const inputs = [...e.target.querySelectorAll('input')].reduce((acc, curr) => {
      acc[curr.name] = curr.value;
      return acc;
    }, {});
  
    const submitButton = e.target.querySelector('button[type="submit"]');
    toggleLoading(submitButton);
  
    postJSON('/api/v2/user/reset', inputs)
      .then(res => {

        const msg = e.target.querySelector('.status-msg.success');
        if (msg) msg.classList.add('d-block');

        const toHide = e.target.querySelectorAll('.hide-when-finished');
        toHide.forEach(el => el.classList.add('d-none'));

        toggleLoading(submitButton);
      }).catch(err => {
  
        const msg = e.target.querySelector('.status-msg.negative');
        if (msg) msg.classList.add('d-block');
        toggleLoading(submitButton);
  
      });
  });

  // show form
  resetForm.classList.remove('d-none');
};

  // insert new password
const insertNew = (token) => {

  if (!token) {
    alert('token non valido');
    return;
  }

  console.log(token);

  const newPasswordForm = document.getElementById('new-password-form');
  newPasswordForm.addEventListener('submit', e => {
    e.preventDefault();
    e.stopPropagation();
    [...e.target.querySelectorAll('.status-msg')].forEach(btn => btn.classList.remove('d-block'));

    const inputs = [...e.target.querySelectorAll('input')].reduce((acc, curr) => {
      acc[curr.name] = curr.value;
      return acc;
    }, {});

    if (inputs.password !== inputs.retype_password ) {
      alert('Le password che hai inserito sono diverse!');
      // TODO better alert
      return;
    }

    const submitButton = e.target.querySelector('button[type="submit"]');
    toggleLoading(submitButton);

    postJSON(`/api/v2/user/reset/${token}`, inputs)
    .then(res => {

      const msg = e.target.querySelector('.status-msg.success');
      if (msg) msg.classList.add('d-block');

      const toHide = e.target.querySelectorAll('.hide-when-finished');
      toHide.forEach(el => el.classList.add('d-none'));

      toggleLoading(submitButton);
    }).catch(err => {

      const msg = e.target.querySelector('.status-msg.negative');
      if (msg) msg.classList.add('d-block');
      toggleLoading(submitButton);

    });
  });

  // show form
  newPasswordForm.classList.remove('d-none');
};

// change password
const changePwd = () => {

  const changePasswordForm = document.getElementById('change-password-form');

  changePasswordForm.addEventListener('submit', e => {
    e.preventDefault();
    e.stopPropagation();
    [...e.target.querySelectorAll('.status-msg')].forEach(btn => btn.classList.remove('d-block'));
  
    const inputs = [...e.target.querySelectorAll('input')].reduce((acc, curr) => {
      acc[curr.name] = curr.value;
      return acc;
    }, {});
  
    if (inputs.new !== inputs.retype_new ) {
      alert('Le password che hai inserito sono diverse!');
      // TODO better alert
      return;
    }
  
    const submitButton = e.target.querySelector('button[type="submit"]');
    toggleLoading(submitButton);
  });

  // show form
  changePasswordForm.classList.remove('d-none');
};



const init = () => {
  const queryStrings = getUrlQueryStrings();
  
  switch (queryStrings.action) {
    case 'change':
      changePwd();
      break;
    case 'new':
      const token = queryStrings.token;
      insertNew(token);
      break;
    default:
      askReset();
      break;
  }
};

// go!
init();