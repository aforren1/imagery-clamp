var imgs = ['a.png', 'b.png']

var trials = []

for (var i = 0; i < imgs.length; i++) {
  trials.push({
    stimulus: imgs[i],
    data: {
      mirror: imgs[i].includes('norm'),
      correct_response: imgs[i].includes('L'),
    },
  })
}
