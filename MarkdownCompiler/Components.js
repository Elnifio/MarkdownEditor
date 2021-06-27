let AST = require("./AST");
let ASTType = AST.ASTTypes;

/** previous codes for styles as plugin
 // let styles = {
 //     "original": 0
 // }
 // Vue.component("note-styles", {
 //     data: function() {
 //         return {current: 0};
 //     },
 //     computed: {
 //         currentStyle: function() {
 //             switch(this.current) {
 //                 case styles.original:
 //                     return {
 //                     }
 //             }
 //         }
 //     },
 //     template: ``,
 // })
 */

// ----------------
// 
// Sentence-level elements
// --------
// Each element is referred as 'sentence' variable
Vue.component(ASTType.Sentence, {
    props: ['sentence'],
    template: `
    <span>
        <component :is="sentence.isCode()?'code':'span'" :class='sentence.getStyle()'>{{ sentence.get() }}</component>
    </span>
    
    `
})

Vue.component(ASTType.Link, {
    props: ['sentence'],
    template: `<span><a v-bind:href="sentence.get('url')">{{ sentence.get('alt') }}</a></span>`
})

Vue.component(ASTType.Latex, {
    props: ['sentence'],
    template: `
    <v-tooltip bottom>
        <template v-slot:activator="{on, attrs}">
            <span v-html="sentence.render()" v-bind="attrs" v-on="on"></span>
        </template>
        <span>
            {{sentence.get()}}
        </span> 
    </v-tooltip>`
})

Vue.component(ASTType.ReferenceSeparator, {
    props: ["sentence"],
    template: `<br />`
})

// ----------------
// 
// Block-level elements
// --------
// Each element is referred as "content" variable
Vue.component(ASTType.Paragraph, {
    props: ["content"],
    template: `
    <p>
        <component v-for="metasen in content.sentences" v-bind:is="metasen.type" v-bind:sentence="metasen"></component>
    </p>`
}) 

Vue.component(ASTType.Separator, {
    props: ["content"],
    template: `<hr />`
})

Vue.component(ASTType.ListItem, {
    props: ["content"],
    template: `
    <li>
        <component v-for="metasen in content.sentences" v-bind:is="metasen.type" v-bind:sentence="metasen"></component>
    </li>
    `
})

Vue.component(ASTType.TODOList, {
    props: ["content"],
    methods: {
        propagateChange: function(args) {
            this.$emit("change", args);
        }
    },
    template: `
        <v-list dense>
            <component v-for="item in content.subBlocks" v-bind:is="item.type" v-bind:content="item"></component>
        </v-list>
    `
})

Vue.component(ASTType.TODO, {
    props: ["content"],
    methods: {
        updateStatus: function() {
            this.$emit("change", 
            {   index: this.content.todoIndex, 
                newcontent: this.content.status?"- [ ] ":"- [x] "
            });
        },
        propagateChange: function(item) {
            this.$emit("change", item);
        },
    },
    // 在嵌套第三个div中使用pt-2来将右侧内容和左侧按钮对齐
    template: `
    <div>
        <div class="d-flex">
            <v-btn icon @click.prevent.stop="logger"><v-icon>{{ content.status? 'mdi-checkbox-marked-outline':'mdi-checkbox-blank-outline' }}</v-icon></v-btn>
            <div class="pt-2">
                <component v-for="metasen in content.sentences" v-bind:is="metasen.type" v-bind:sentence="metasen"></component>
            </div>
        </div>
        <div v-if="content.hasAction()" class="d-flex">
            <v-divider vertical class="mx-4"></v-divider>
            <div>
                <component 
                    v-for="action in content.subActions"
                    :is="action.type"
                    :content="action">
                </component>
            </div>
        </div>
    </div>
    `
})

Vue.component(ASTType.CodeBlock, {
    props: ["content"],
    data: function() {
        return {
            codes: this.content,
        }
    },
    methods: {
        toggleStatus: function() {
            console.log("toggling status");
            console.log(this.content);
            this.content.activated = !this.content.activated;
        }
    },
    template: `
    <p class="code" >
        <template>
            <template v-for="(codes, index) in content.get().split('\\n')" v-if="codes">
                <span>{{index+1}} {{ codes }}</span>
                <br />
            </template>
            <hr />
            <v-btn @click.stop=toggleStatus>{{ content.activated }}</v-btn>
        </template>
    </p>
    `
})

/* Old design:

<div class="codeblock">
    <template v-for="(codes, index) in content.get().split('\\n')" v-if="codes">
        <span>{{index+1}} {{ codes }}</span>
        <br />
    </template>
    <hr />
</div>
*/
Vue.component(ASTType.LatexBlock, {
    props: ["content"],
    template: `<div class="latex-result" v-html="content.render()"></div>`
}) 

Vue.component(ASTType.Image, {
    props: ["content"],
    template: `
    <img v-bind:src="content.get('src')" v-bind:alt="content.get('alt')">
    `
})

Vue.component(ASTType.UL, {
    props: ['content'],
    template: `
        <ul>
            <component v-for="item in content.subBlocks" v-bind:is="item.type" v-bind:content="item"></component>
        </ul>
    `
})

Vue.component(ASTType.OL, {
    props: ['content'],
    template: `
        <ol>
            <component v-for="item in content.subBlocks" v-bind:is="item.type" v-bind:content="item"></component>
        </ol>
    `
})

// TODO: redesign style for reference
Vue.component(ASTType.Reference, {
    props: ["content"],
    template: `
    <blockquote class="blockquote">
    <p>
        <component v-for="metasen in content.sentences" v-bind:is="metasen.type" v-bind:sentence="metasen"></component>
    </p>
    </blockquote>`
})

// TODO: redesign this component
Vue.component(ASTType.Header, {
    props: ["content"],
    template: `
    <h1 v-if="content.level === 1">
        {{ content.get() }}
    </h1>
    <h2 v-else-if="content.level === 2">
        {{ content.get() }}
    </h2>
    <h3 v-else-if="content.level === 3">
        {{ content.get() }}
    </h3>
    <h4 v-else-if="content.level === 4">
        {{ content.get() }}
    </h4>
    <h5 v-else-if="content.level === 5">
        {{ content.get() }}
    </h5>
    <h6 v-else-if="content.level === 6">
        {{ content.get() }}
    </h6>`,
})

// ----------------
// 
// Top-level element: Markdown Note
// 
// ----------------
Vue.component(ASTType.MD, {
    props: ['ast'],
    methods: {
        propagateChange: function(index, content) {
            this.$emit("change", index, content);
        },
        propagateReStoreAST: function() {
            this.$emit("re-store-ast");
        }
    },
    template: `
    <div class="markdown-container">
        <component v-for="block in ast.blocks" v-bind:is="block.type" v-bind:content="block" @change="propagateChange" @re-store-ast="propagateReStoreAST"></component>
    </div>`
})