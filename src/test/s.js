let js = {
    asdf : "sadf"
}
let s = {...js};

delete s.asdf;
console.log(s);
console.log(js);