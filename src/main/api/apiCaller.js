import { addCategories, addSubCategories, addUsers, addRecentSpendings, addAllSubCategories } from '../store/mainDataSlice'
import store from '../store/store';

export function getCategories() {
  fetch("/api/categories", {
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
  fetch("/api/spendings", {
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
  fetch("/api/subCategories/" + id, {
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
  fetch("/api/users", {
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
  return fetch('/api/' + ext, {
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
  return fetch('/api/spendings/delete/' + id, {
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
