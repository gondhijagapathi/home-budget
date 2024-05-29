import { addCategories, addSubCategories, addUsers, addRecentSpendings, addAllSubCategories } from '../store/mainDataSlice'
import store from '../store/store';

export function getCategories() {
  fetch("http://192.168.0.2:8083/categories", {
    method: 'GET',
  })
    .then(res => { return res.text() })
    .then(data => JSON.parse(data))
    .then(
      (result) => {
        store.dispatch(addCategories(result))
      },
      (error) => {
        console.log("error from api" + error)
      }
    )
}

export function getRecentSpendings() {
  fetch("http://192.168.0.2:8083/spendings", {
    method: 'GET',
  })
    .then(res => { return res.text() })
    .then(data => JSON.parse(data))
    .then(
      (result) => {
        store.dispatch(addRecentSpendings(result))
      },
      (error) => {
        console.log("error from api" + error)
      }
    )
}

export function getSubCategories(id) {
  fetch("http://192.168.0.2:8083/subcategories/" + id, {
    method: 'GET',
  })
    .then(res => { return res.text() })
    .then(data => JSON.parse(data))
    .then(
      (result) => {
        if (id === 0) {
          store.dispatch(addAllSubCategories(result))
        } else {
          store.dispatch(addSubCategories(result))
        }
      },
      (error) => {
        console.log("error from api" + error)
      }
    )
}

export function getUsers() {
  fetch("http://192.168.0.2:8083/users", {
    method: 'GET',
  })
    .then(res => { return res.text() })
    .then(data => JSON.parse(data))
    .then(
      (result) => {
        store.dispatch(addUsers(result))
      },
      (error) => {
        console.log("error from api" + error)
      }
    )
}

export async function postData(ext, data, edit = false) {
  var reqData = JSON.stringify({
    data
  })
  if (edit) {
    reqData = JSON.stringify(data)
  }
  return fetch('http://192.168.0.2:8083/' + ext, {
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

export async function deleteSpending(id) {
  return fetch('http://192.168.0.2:8083/spendings/delete/' + id, {
    method: 'post',
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
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
