/**
 * 
 * Author: Elnifio
 * GitHub: https://github.com/Elnifio
 */

import Parser from "./parser.js";
import Renderer from "./renderer.js";

$(() => {
    let context = ``;
    $("#area").text(context);
    $("#parse").on("click", (e) => {
        e.preventDefault();
        let val = $("#area").val();
        // $("#data").html(val);
        let parser = new Parser(val);
        parser.parse();
        // $("#result").html(parser.head.printNode(true));
        let renderer = new Renderer(parser);
        renderer.renderPage();
        $("#result").html(renderer.doc);
    })
})