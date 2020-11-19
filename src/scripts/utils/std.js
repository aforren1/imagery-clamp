// standard deviation
// https://stackoverflow.com/a/53577159/2690232

export default function std(array) {
  const n = array.length
  const mean = array.reduce((a, b) => a + b) / n
  return Math.sqrt(array.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n)
}
