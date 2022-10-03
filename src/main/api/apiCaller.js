import { addCategories, addItems, addSubCategories, addMeasures } from '../store/mainDataSlice'
import store from '../store/store';

export function getCategories() {
    fetch("http://rest.jagapathi.me/categories", {
        method: 'GET',
    })
      .then(res => {console.log(res); return res.text()})
      .then(data => JSON.parse(data))
      .then(
        (result) => {
          store.dispatch(addCategories(result))
        },
        (error) => {
            console.log("error from api"+error)
        }
      )
}

export function getSubCategories(id) {
    fetch("http://rest.jagapathi.me/subcategories/"+id, {
        method: 'GET',
    })
      .then(res => {console.log(res); return res.text()})
      .then(data => JSON.parse(data))
      .then(
        (result) => {
          store.dispatch(addSubCategories(result))
        },
        (error) => {
            console.log("error from api"+error)
        }
      )
}

export function getItems(id) {
    fetch("http://rest.jagapathi.me/items/"+id, {
        method: 'GET',
    })
      .then(res => {console.log(res); return res.text()})
      .then(data => JSON.parse(data))
      .then(
        (result) => {
          store.dispatch(addItems(result))
        },
        (error) => {
            console.log("error from api"+error)
        }
      )
}

export function getMeasures() {
    fetch("http://rest.jagapathi.me/measures", {
        method: 'GET',
    })
      .then(res => {console.log(res); return res.text()})
      .then(data => JSON.parse(data))
      .then(
        (result) => {
          store.dispatch(addMeasures(result))
        },
        (error) => {
            console.log("error from api"+error)
        }
      )
}

export function postData(ext, data) {
  const res = fetch('http://rest.jagapathi.me/'+ext, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    body: data,
   })
   .then((response) => response.json())
   .then((responseJson) => {
   })
   .catch((error) => {
     console.error(error);
   });
}