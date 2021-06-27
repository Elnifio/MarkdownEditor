let Parser = require("../MarkdownCompiler/parser");
let Components = require("../MarkdownCompiler/Components");
let Diff = require("../MarkdownCompiler/ASTDiffer");
let AST = require("../MarkdownCompiler/AST");
let ASTZipper = require("../MarkdownCompiler/ASTZipper");
let Disp = require("../MarkdownCompiler/ASTDisplay");

let pobj = new Parser.Parser();
let differ = new Diff.Differ();
let zipper = new ASTZipper.ASTZipper();
let disp = new Disp.Displayer();

let Editor = function() {
    this.state = {
        currval: "", 
    };

    this.setCurrent = function(newval) {
        this.state.currval = newval;
    };

    this.getCurrent = function() { return this.state.currval; };
}
exports.Editor = Editor;

/**
 * 
 * @param {AST.MD} ast root Markdown Block container
 */
let TODOCollector = function(ast) {
    if (ast) return ast.blocks.filter(x => x.type == AST.ASTTypes.TODOList).map(x => zipper.zip(x));
}
exports.TODOCollector = TODOCollector;

Vue.component("editor", {
    props: {
        "estore": Editor,
        "value": String,
        "editable": Boolean,
    },

    methods: {
        updator: function(event) {
            // console.log(event.target.value);
            this.$emit("value-update", event.target.value);
        },
        inputUpdate: function(event) {
            this.$emit("input-update", event);
        },
        select: function(event) {
            console.log(event);
        },
    },
    template: `
    <v-textarea 
        @blur="updator($event)" 
        @select="select($event)" 
        :value="value" 
        @input="inputUpdate($event)" 
        auto-grow
        :disabled="!editable">
    </v-textarea>
    `
});

let newAST;
Vue.component("editor-control", {
    props: ['estore', 'editable'],
    data: function() {
        return {
            editorstore: this.estore,
            ast: pobj.parse(this.estore.getCurrent()),
            selector: {
                start: 0, end: 0
            }
        }
    },
    watch: {
        "editorstore.state.currval": function(newval, oldval) {
            newAST = pobj.parse(newval);
            differ.diff(newAST, this.ast);
            this.ast = newAST;
        }
    },
    methods: { 
        store: function(event) {
            disp.visit(this.ast);
            this.$emit("store-to-system", TODOCollector(this.ast));
        },
        update: function(event) {
            this.editorstore.setCurrent(event);
        },
        select: function(event) {
            console.log(event);
        },
        change: function(newobject) {
            let oldvalue = this.editorstore.getCurrent();
            this.editorstore.setCurrent(oldvalue.substring(0, newobject.index.start) + newobject.newcontent + oldvalue.substring(newobject.index.end));
            this.$emit("store-to-system", TODOCollector(this.ast));
        }
    },
    template: `
    <v-row>
        <v-col cols=6>
            <editor 
                v-model="editorstore.getCurrent()" 
                @value-update="store($event)" 
                @input-update="update($event)"
                :editable="editable"></editor>
        </v-col>
        <v-col cols=6>
            <markdown-block :ast="ast" v-if="ast" @change="change"></markdown-block>
        </v-col>
    </v-row>
    `
})

/*
deleted content: 
<editor v-model="editorvalue" @input="update($event)"></editor>
            <v-textarea @input="update($event)" @select="select($event)" :value="evalue">
            </v-textarea>
*/