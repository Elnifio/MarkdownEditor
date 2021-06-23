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
    template: `<span v-bind:class='sentence.getStyle()'>{{ sentence.get() }}</span>`
})

Vue.component(ASTType.Link, {
    props: ['sentence'],
    template: `<span><a v-bind:href="sentence.get('url')">{{ sentence.get('alt') }}</a></span>`
})

// TODO: REPLACE THIS WITH vue-latex
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

// TODO: REDESIGN TODO ITEMS
Vue.component(ASTType.TODO, {
    props: ["content"],
    template: `
    <div>
        <span>Complete? {{content.status}}</span>
        <component v-for="metasen in content.sentences" v-bind:is="metasen.type" v-bind:sentence="metasen"></component>
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
    <p class="codeblock" >
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

// deleted contents: 
/*
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
    <p class="reference">
        <component v-for="metasen in content.sentences" v-bind:is="metasen.type" v-bind:sentence="metasen"></component>
    </p>`
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
    template: `
    <div class="markdown-container">
        <component v-for="block in ast.blocks" v-bind:is="block.type" v-bind:content="block"></component>
    </div>`
})