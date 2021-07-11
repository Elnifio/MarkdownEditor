let unzipper = require("../MarkdownCompiler/ASTZipper").ASTUnzipper;
let disp = require("../MarkdownCompiler/ASTDisplay");
let disper = new disp.Displayer();
let Parser = require("../MarkdownCompiler/parser");
let pobj = new Parser.Parser();
let TODOCollector = require("../Editor/EditorModule").TODOCollector;

let collectTabs = function(listnodes) {
    return [];
}

let newtodo;
Vue.component("todo-item", {
    props: ['fileNode'],
    data: function() {
        return {
            node: this.fileNode,
            asts: this.fileNode.todos.map(x => unzipper(x)),
        };
    },
    methods: {
        updateAtIndex: function(newobject, block) {
            this.node.updateAtIndex(newobject.index, newobject.newcontent);
            newtodo = TODOCollector(pobj.parse(this.node.content));
            this.fileNode.todos = newtodo;
            this.asts = this.fileNode.todos.map(x => unzipper(x));
            this.$emit("update-editor-content");
        },
        openFile: function() {
            this.$emit("editor-switch-to-file", this.node);
        }
    },
    template: `
    <v-card max-width="25vw" min-width="200px" max-height="99%" style="flex-direction:column;display:flex;" color="grey lighten-4">
        <v-card-title style="flex:0 0 auto" :class="node.tabs.length!=0?'mb-0 pb-0':''">
            {{ node.getCanonicalName() }}
        </v-card-title>

        <v-chip-group v-if="node.tabs.length!=0" style="flex:0 0 auto" class="mx-1">
            <tab-chip
                v-for="tab in node.tabs"
                :tab="tab"
                :tabDelete="false"
                :activated="true">
            </tab-chip>
        </v-chip-group>

        <v-divider></v-divider>

        <v-sheet :elevation="0" style="overflow:auto;flex:1 1 auto" class="mx-2" color="grey lighten-4">
            <v-hover v-slot="{ hover }" v-for="block in asts">
                <v-card class="ma-2 pa-2" :class="hover?'grey lighten-5':''">
                    <component 
                        :is="block.type" 
                        :content="block" 
                        @change="updateAtIndex($event, block)">
                    </component>
                </v-card>
            </v-hover>
        </v-sheet>

        <v-divider></v-divider>

        <v-card-text class="d-flex py-1" style="flex:0 0 auto">
            <span class="mr-auto">{{ node.path }}</span>
            <v-icon class="float-right" @click.prevent.stop="openFile">mdi-file-edit-outline</v-icon>
        </v-card-text>
    </v-card>
    `
})

let idx;
Vue.component("todo-lists", {
    props: ['todonodes'],
    data: function() {
        return {
            mask: []
        }
    },
    computed: {
        tabs: function() {
            return Array.from(new Set(this.todonodes.map(x => x.tabs).flat()));
        }
    },
    methods: {
        propagateUpdateEditor: function() {
            this.$emit("update-editor-content")
        },
        tabClickHandler: function(tab) {
            idx = this.mask.indexOf(tab)
            if (idx < 0) {
                this.mask.push(tab);
            } else {
                this.mask.splice(idx, 1);
            }
        },
        containLabel: function(node) {
            // either this node contains all mask, or the mask length is 0
            return (this.mask.map(
                    x => node.tabs.indexOf(x) >= 0
                ).reduce(
                    (accu, curr) => accu && curr, 
                true)) || this.mask.length==0;
        },
        propagateSwitch: function(node){
            this.$emit("editor-switch-to-file", node);
        }
    },
    template: `
    <v-sheet style="height:100%;flex-direction:column;display:flex">
        <v-sheet v-if="tabs.length!=0" class="mx-1 d-flex" style="flex:0 0 auto">
            <span class="py-2">
                Tag Filter:
            </span>
            <v-chip-group>
                <tab-chip
                    v-for="tab in tabs"
                    :tab="tab"
                    :tabDelete="false"
                    :activated="mask.indexOf(tab)<0"
                    @tab-click="tabClickHandler">
                </tab-chip>
            </v-chip-group>
        </v-sheet>
        <v-slide-group class="py-2" style="flex:1 1 auto;overflow:auto">
            <v-slide-item v-for="node in todonodes" style="height:inherit" v-if="containLabel(node)">
                <v-sheet height="inherit">
                    <todo-item 
                        :fileNode="node" 
                        :key="node.path" 
                        class="mx-2" 
                        @update-editor-content="propagateUpdateEditor"
                        @editor-switch-to-file="propagateSwitch">
                    </todo-item>
                </v-sheet>
            </v-slide-item>
        </v-slide-group>
    </v-sheet>
    `
})