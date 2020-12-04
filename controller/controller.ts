export default class Controller {
  [key: string]: any

  constructor() {
    console.log("construct controller");
  }

  log(msg: string) {
    console.log(msg);
  }
}
