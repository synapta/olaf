getText('/views/template/navbar.html').then(template => {
  const navbarContainer = document.getElementById('navbar');
  if (navbarContainer) {
    navbarContainer.innerHTML = template;
  };
});

getText('/views/template/footer.html').then(template => {
  const footerContainer = document.getElementById('footer');
  if (footerContainer) {
    const out = Mustache.render(template, { currentYear: new Date().getFullYear() })
    footerContainer.innerHTML = out;
  };
});

