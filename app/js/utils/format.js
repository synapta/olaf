
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