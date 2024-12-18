

function testfunctions() {
    let sample = [1,2,3];
    sample.splice(3, 0, 4);
    console.log(sample);
    sample.splice(4, 0, 5);
    console.log(sample);
    sample.splice(5, 0, 6);
    console.log(sample);
}