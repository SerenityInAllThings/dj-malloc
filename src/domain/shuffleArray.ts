export const shuffleArray = <ArrayItemType>(original: ArrayItemType[]) => 
  original
    .map(item => ({ item, sort: Math.random() }))
    .sort(({sort}, {sort: secondSort}) => sort - secondSort)
    .map(({ item }) => item)