USER = new User();

getText('/views/template/navbar.html').then(async template => {

  const navbarContainer = document.getElementById('navbar');

  if (!navbarContainer) {
    return;
  }
  
  const user = await USER.getStatus();

  const bodyClass = user.status === 'anonymous' ? 'not-logged' : 'logged';
  document.body.classList.add(bodyClass);
  
  console.log('loader.js - userStaus', user);

  // redirect to verify account page if necessary
  if (user.status !== 'anonymous' && !user.isVerified() && window.location.pathname !== '/verify') {
    window.location.href = '/verify';
  }

  // console.log({ logged: user.isLogged(), admin: user.isAdmin() });

  // TODO - use user status to render navbar
  const out = Mustache.render(template, { logged: user.isLogged(), admin: user.isAdmin(), name: user.getName(), email: user.getEmail() });
  navbarContainer.innerHTML = out;

  $('.ui.dropdown').dropdown();

  $('.ui.toggle.button').click(() => $('.ui.vertical.menu').toggle("250", "linear"));

  // logout
  const logoutBtns = document.querySelectorAll('.logout-button');
  logoutBtns.forEach(btn => btn.addEventListener('click', e => user.logout()));

  // go to profile
  const profileBtns = document.querySelectorAll('.profile-button');
  profileBtns.forEach(btn => btn.addEventListener('click', e => window.location.href = '/profile'));
});

getText('/views/template/footer.html').then(template => {
  const footerContainer = document.getElementById('footer');

  if (!footerContainer) {
    return;
  }

  const out = Mustache.render(template, { currentYear: new Date().getFullYear() });
  footerContainer.innerHTML = out;  
});

