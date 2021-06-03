let AST = require("./AST");
let ASTType = AST.ASTTypes;

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
    template: `<span>{{sentence.get()}}</span>`
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
    template: `
    <div>
        <template v-for="codes in content.get().split('\\n')">
            <span>{{ codes }}</span>
            <br />
        </template>
    </div>
    `
})

// TODO: REPLACE THIS WITH vue-latex
Vue.component(ASTType.LatexBlock, {
    props: ["content"],
    template: `
    <div>
        <template v-for="codes in content.get().split('\\n')">
            <span>{{ codes }}</span>
            <br />
        </template>
    </div>
    `
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
    <p>
        <component v-for="metasen in content.sentences" v-bind:is="metasen.type" v-bind:sentence="metasen"></component>
    </p>`
})

// TODO: redesign this component
Vue.component(ASTType.Header, {
    props: ["content"],
    template: `
    <p>Header: {{ content.level }} | {{ content.get() }}</p>`
})

// ----------------
// 
// Top-level element: Markdown Note
// 
// ----------------
Vue.component(ASTType.MD, {
    props: ['ast'],
    template: `
    <div>
        <component v-for="block in ast.blocks" v-bind:is="block.type" v-bind:content="block"></component>
    </div>`
})