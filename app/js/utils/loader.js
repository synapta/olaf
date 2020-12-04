USER = new User();

getText('/views/template/navbar.html').then(async template => {

  const navbarContainer = document.getElementById('navbar');

  if (!navbarContainer) {
    return;
  }
  
  const user = await USER.getStatus();
  // console.log('loader.js - userStaus', user);
  // console.log({ logged: user.isLogged(), admin: user.isAdmin() });

  // TODO - use user status to render navbar
  const out = Mustache.render(template, { logged: user.isLogged(), admin: user.isAdmin() });
  navbarContainer.innerHTML = out;
});

getText('/views/template/footer.html').then(template => {
  const footerContainer = document.getElementById('footer');

  if (!footerContainer) {
    return;
  }

  const out = Mustache.render(template, { currentYear: new Date().getFullYear() })
  footerContainer.innerHTML = out;  
});

