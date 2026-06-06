const routes = ["sync", "async"];
const scenarios = ["C1", "C2", "C3", "C4", "C5"];

const shuffle = <T>(array: T[]) => {
  let currentIndex = array.length;
  
  while (currentIndex !== 0) {
    const randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    const temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
}

const rounds = routes.flatMap(route => scenarios.map(scenario => ({ route, scenario })));
shuffle(rounds);

console.log(rounds);