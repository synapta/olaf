
const formatEuro = value => {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
};

const formatDate = value => {
  if (!value) {
    return null;
  }
  
  return new Date(value).toLocaleDateString('it-IT', {
    year  : 'numeric',
    month : '2-digit', 
    day   : '2-digit' 
  });
};

const formatDateAndTime = value => {
  if (!value) {
    return null;
  }
  
  const date = new Date(value).toLocaleDateString('it-IT', {
    year  : 'numeric',
    month : '2-digit', 
    day   : '2-digit' 
  });

  const time = new Date(value).toLocaleTimeString('it-IT');

  return `${date} - ${time}`;
};