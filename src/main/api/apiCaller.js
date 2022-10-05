import { addCategories, addItems, addSubCategories, addMeasures, addShops, addUsers } from '../store/mainDataSlice'
import store from '../store/store';

export function getCategories() {
    fetch("http://rest.jagapathi.me/categories", {
        method: 'GET',
    })
      .then(res => {return res.text()})
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
      .then(res => {return res.text()})
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
      .then(res => {return res.text()})
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
      .then(res => {return res.text()})
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

export function getShops() {
  fetch("http://rest.jagapathi.me/shops", {
      method: 'GET',
  })
    .then(res => {return res.text()})
    .then(data => JSON.parse(data))
    .then(
      (result) => {
        store.dispatch(addShops(result))
      },
      (error) => {
          console.log("error from api"+error)
      }
    )
}

export function getUsers() {
  fetch("http://rest.jagapathi.me/users", {
      method: 'GET',
  })
    .then(res => {return res.text()})
    .then(data => JSON.parse(data))
    .then(
      (result) => {
        store.dispatch(addUsers(result))
      },
      (error) => {
          console.log("error from api"+error)
      }
    )
}

export async function postData(ext, data) {
  const reqData = JSON.stringify({
    data
  })
  return fetch('http://rest.jagapathi.me/'+ext, {
    method: 'post',
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: reqData,
   })
   .then((response) => response.json())
   .then((responseJson) => {
    return "204"
   })
   .catch((error) => {
     console.error(error);
     return "500"
   });
}