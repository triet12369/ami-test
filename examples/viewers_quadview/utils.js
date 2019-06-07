const dicomFolder = './DICOM/';
const filenames = [];

function pad(num, size) {
  var s = num+'';
  while (s.length < size) s = '0' + s;
  return s;
}
for (var i = 1; i < 200; i++){
  filenames.push('CT'+ pad(i,6));
}
console.log(filenames);

  export const file = filenames.map(filename => {
    return dicomFolder + filename;
  });
  
  export const colors = {
    red: 0xff0000,
    blue: 0x0000ff,
    darkGrey: 0x353535,
  };
  