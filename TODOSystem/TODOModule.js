let unzipper = require("../MarkdownCompiler/ASTZipper").ASTUnzipper;

let collectTabs = function(listnodes) {
    return [];
}

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
            block.status = !block.status;
        },
    },
    template: `
    <v-card>
        <v-card-title>
            {{ node.getCanonicalName() }}
        </v-card-title>
        <v-card-subtitle>
            {{ node.path }}
        </v-card-subtitle>
        <v-card flat height="15vh" style="overflow:auto">
            <component v-for="block in asts" :is="block.type" :content="block" @change="updateAtIndex($event, block)"></component>
        </v-card>
    </v-card>
    `
})

Vue.component("todo-lists", {
    props: ['todonodes'],
    template: `
    <v-row dense>
        <v-col v-for="node in todonodes" :key="node.path" xs="12" sm="6" md="3">
            <todo-item :fileNode="node"></todo-item>
        </v-col>
    </v-row>
    `
})

Vue.component("todo-page", {
    props: ["nodes"],
    data: function() {
        return {
            todonodes: this.nodes,
            tablists: [
                {title: "All TODOs", 
                icon: "mdi-checkbox-marked-outline", 
                mask: (x) => { return true; }}
            ]
        }
    },
    template: `
        <div>
            <v-tabs icons-and-text>
                <v-tab v-for="tab in tablists" :key="tab.title">
                    <v-icon>
                        {{ tab.icon }}
                    </v-icon>
                    {{ tab.title }}
                </v-tab>

                
            </v-tabs>
        </div>
    `
})