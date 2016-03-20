function promisifyFunc(func) {
  return function(...args) {
    return new Promise((resolve, reject) => {
      func.apply(this, [ ...args, (err, data) => {
        if (err)
          return reject(err);
        resolve(data);
      }]);
    });
  }
}

function promisifyObject(oldObj) {
  const newObj = {};
  for (let key in oldObj)
    if (typeof oldObj[key] === 'function')
      newObj[key] = promisifyFunc(oldObj[key]);
    else
      newObj[key] = oldObj[key];
  return newObj;
}

function promisifyClass(oldClass) {
  const newClass = promisifyFunc(oldClass);

  for (let key in oldClass.prototype)
    newClass.prototype[key] = promisifyFunc(oldClass.prototype[key]);
  newClass.prototype.constructor = newClass;

  for (let key in oldClass)
    newClass[key] = promisifyFunc(oldClass[key]);

  return newClass;
}

function promisify(something) {
  if (typeof something === 'function')
    return promisifyClass(something);

  if (typeof something === 'object')
    return promisifyObject(something);
}

export { promisifyFunc, promisifyClass, promisifyObject };
export default promisify;