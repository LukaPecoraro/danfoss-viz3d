//import { init, animate } from "./main";

var boxes = []; // Array to store boxes
let grid = {
    id : "grid_1",
    width : 8,
    height : 8,
    depth : 8
}

document.getElementById("gridShape").textContent = "W:" + grid.width + " H:"+  grid.height + " D:" + grid.depth;

function addBox() {
    var width = document.getElementById("width").value;
    var height = document.getElementById("height").value;
    var depth = document.getElementById("depth").value;
  
    var box = {
        width: parseInt(width),
        height: parseInt(height),
        depth: parseInt(depth),
        position_x : 0,
        position_y : 0,
        position_z : 0
    };
  
    boxes.push(box);
  
    document.getElementById("width").value = "";
    document.getElementById("height").value = "";
    document.getElementById("depth").value = "";
  
    // Update box list
    var boxList = document.getElementById("boxList");
    var listItem = document.createElement("li");
    listItem.textContent = "Width: " + box.width + ", Height: " + box.height + ", Depth: " + box.depth;
    boxList.appendChild(listItem);
}

document.getElementById("myForm").addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent form from submitting

    // Create data object to send in POST request
    var data = {
        boxes: boxes,
        grid: grid
    };

    console.log(data)

    // Create XMLHttpRequest object
    // var xhr = new XMLHttpRequest();
    // xhr.open("POST", "http://localhost:8080/solveConf", true);
    // xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    // xhr.send();
    // xhr.responseType = "json";
    // xhr.onload = () => {
    //   if (xhr.readyState == 4 && xhr.status == 200) {
    //     console.log("JEEEEEJJJJJJJJJJJJJJJJ")
    //     console.log(xhr.response);
    //     PLAN_DATA = xhr.response;
    //     init();
    //     animate();
    //   } else {
    //     console.log(`Error: ${xhr.status}`);
    //   }
    // };


    const proxyurl = "https://cors-anywhere.herokuapp.com/";

    fetch("http://localhost:8080/solveConf", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(function(response) {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error("Error: " + response.status);
        }
    })
    .then(function(data) {
        console.log("Response:", data);
        PLAN_DATA = xhr.response;
        init();
        animate();
        // Handle successful response
    })
    .catch(function(error) {
        console.error(error);
        // Handle error
    });
});