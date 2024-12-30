---
title: 深入理解 babel：从理论到实践的完整指南
date: 2019-01-29
update_at: 2024-12-30
description: 本文深入剖析 babel 的工作原理、最佳实践和实现技巧。通过实际案例和性能对比，帮助你全面掌握这一关键的编译技术。
tags:
  - front-end
  - babel
  - ast
  - plugin
---


babel作为JavaScript现代编译器，在babel的编译过程中，我们可以编写一些插件来支持中间编译过程的产物转换，以下就从抽象语法树AST出发解释整个编译转换过程，以及写一个小的babel插件。

### AST编译解析

[AST](https://zh.wikipedia.org/wiki/%E6%8A%BD%E8%B1%A1%E8%AA%9E%E6%B3%95%E6%A8%B9)[维基百科]:在[计算机科学](https://zh.wikipedia.org/wiki/%E8%AE%A1%E7%AE%97%E6%9C%BA%E7%A7%91%E5%AD%A6)中，**抽象语法树**（**A**bstract **S**yntax **T**ree，AST），或简称**语法树**（Syntax tree），是[源代码](https://zh.wikipedia.org/wiki/%E6%BA%90%E4%BB%A3%E7%A0%81)[语法](https://zh.wikipedia.org/wiki/%E8%AF%AD%E6%B3%95%E5%AD%A6)结构的一种抽象表示。它以[树状](https://zh.wikipedia.org/wiki/%E6%A0%91_(%E5%9B%BE%E8%AE%BA))的形式表现[编程语言](https://zh.wikipedia.org/wiki/%E7%BC%96%E7%A8%8B%E8%AF%AD%E8%A8%80)的语法结构，树上的每个节点都表示源代码中的一种结构。之所以说语法是“抽象”的，是因为这里的语法并不会表示出真实语法中出现的每个细节。比如，嵌套括号被隐含在树的结构中，并没有以节点的形式呈现；而类似于 `if-condition-then` 这样的条件跳转语句，可以使用带有两个分支的节点来表示。

https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2018/7/24/164cb702dc30cb83~tplv-t2oaga2asx-image.image

和抽象语法树相对的是具体语法树（通常称作[分析树](https://zh.wikipedia.org/wiki/%E5%88%86%E6%9E%90%E6%A0%91)）。一般的，在源代码的翻译和[编译](https://zh.wikipedia.org/wiki/%E7%BC%96%E8%AF%91)过程中，[语法分析器](https://zh.wikipedia.org/wiki/%E8%AA%9E%E6%B3%95%E5%88%86%E6%9E%90%E5%99%A8)创建出分析树。一旦AST被创建出来，在后续的处理过程中，比如[语义分析](https://zh.wikipedia.org/wiki/%E8%AF%AD%E4%B9%89%E5%88%86%E6%9E%90)阶段，会添加一些信息。

如何利用AST解析function ast(){}，更改后重新恢复

https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2018/7/24/164cb6dede486095~tplv-t2oaga2asx-image.image

分三步走：

- 解析js的语法=>语法树
- 遍历树（先序深度优先）=> 更改树的内容
- 生成新的树

```
const esprima = require('esprima');//解析js的语法的包
const estraverse = require('estraverse');//遍历树的包
const escodegen = require('escodegen');//生成新的树的包

let code = `function ast(){}`;
//解析js的语法
let tree = esprima.parseScript(code);
//遍历树
estraverse.traverse(tree, {
    enter(node) {
        console.log('enter: '+node.type);
        }, leave(node){
         console.log('leave: '+node.type);
     }
});
//生成新的树
let r = escodegen.generate(tree);
console.log(r);

```

https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2018/7/24/164cb6dede702e66~tplv-t2oaga2asx-image.image

https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2018/7/24/164cb6dede9a715c~tplv-t2oaga2asx-image.image

更改树的内容后

```
const esprima = require('esprima');
const estraverse = require('estraverse');
const escodegen = require('escodegen');

let code = `function ast(){}`;
let tree = esprima.parseScript(code);
estraverse.traverse(tree, {
    enter(node) {
        if (node.type === 'Identifier') {
            node.name = 'Jomsou';
        }
        // console.log('enter: '+node.type);
        // }, leave(node){
        //  console.log('leave: '+node.type);
     }
});
let r = escodegen.generate(tree);
console.log(r);

```

```
//结果
function Jomsou() {
}

```

### babel插件

1、ES6箭头函数`let sum = (a, b)=>{return a+b};转化为ES5普通函数

https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2018/7/24/164cb6dedeb72693~tplv-t2oaga2asx-image.image

https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2018/7/24/164cb702dc7054a3~tplv-t2oaga2asx-image.image

```
const babel = require('babel-core');//babel核心解析库
const t = require('babel-types');//babel类型转化库

let code = `let sum = (a, b)=>{return a+b}`;
let ArrowPlugins = {
    //访问者模式
    visitor: {
        //捕获匹配的API
        ArrowFunctionExpression(path){
            let {node} = path;
            let body = node.body;
            let params = node.params;
            let r = t.functionExpression(null, params, body, false, false);
            path.replaceWith(r);
        }
    }
}
let d = babel.transform(code, {
    plugins: [
        ArrowPlugins
    ]
})
console.log(d.code);

```

箭头函数这样写let sum = (a, b)=>a+b;的转化

```
let babel = require('babel-core');
let t = require('babel-types');

let code = `let sum = (a, b)=>a+b`;

//.babelrc
let AllowPlugins = {
    visitor: {
        ArrowFunctionExpression(path){
            let node = path.node;
            let params = node.params;
            let body = node.body;
            if(!t.isBlockStatement(body)){
                let returnStatement = t.returnStatement(body);
                body = t.blockStatement([returnStatement]);
            }
            let funcs = t.functionExpression(null, params, body, false, false);
            path.replaceWith(funcs);
        }
    }
}
let r = babel.transform(code, {
    plugins:[
        AllowPlugins
    ]
})

console.log(r.code);

```

2、class

```
let code = `
class Jomsou{
    constructor(name){
        this.name = name;
    }
    getName(){
        return this.name;
    }
}
`

```

a) 实现constructor的转化

```
const babel = require('babel-core');//babel核心解析库
const t = require('babel-types');//babel类型转化库

/**
 * function Jomsou(name){
 *  this.name = name;
 * }
 * Jomsou.prototype.getName = function(){
 *  return this.name;
 * }
 */
let code = `
class Jomsou{
    constructor(name){
        this.name = name;
    }
    getName(){
        return this.name;
    }
}
`
let ClassPlugin = {
    visitor: {
        ClassDeclaration(path){
            let {node} = path;
            let className = node.id.name;
            className = t.identifier(className);
            //console.log(className);
            let funs = t.functionDeclaration(className, [], t.blockStatement([]), false, false);
            path.replaceWith(funs);
        }
    }
}
let d = babel.transform(code, {
    plugins: [
        ClassPlugin
    ]
})
console.log(d.code);

```

b) 实现class的方法函数转化为原型方法

```
const babel = require('babel-core');//babel核心解析库
const t = require('babel-types');//babel类型转化库

/**
 * function Jomsou(name){
 *
 * }
 */
let code = `
class Jomsou{
    constructor(name){
        this.name = name;
    }
    getName(){
        return this.name;
    }
}
`
let ClassPlugin = {
    visitor: {
        ClassDeclaration(path){
            let {node} = path;
            let className = node.id.name;
            className = t.identifier(className);
            let classList = node.body.body;
            //console.log(className);
            let funs = t.functionDeclaration(className, [], t.blockStatement([]), false, false);

            let es5func = [];

            classList.forEach((item, index)=>{
                let body = classList[index].body;

                if(item.kind==='constructor')
                {
                    let params = item.params.length?item.params.map(item=>item.name):[];
                    params = t.identifier(params);
                    funs = t.functionDeclaration(className, [params], body, false, false);
                    path.replaceWith(funs);
                }else {
                    let protoObj = t.memberExpression(className, t.identifier('prototype'));
                    let left = t.memberExpression(protoObj, t.identifier(item.key.name));
                    let right = t.functionExpression(null, [], body, false, false);

                    let assign = t.assignmentExpression('=', left, right);
                    es5func.push(assign);
                }
            })
            if(es5func.length==0)
            {
                path.replaceWith(funs);
            }
            else {
                es5func.push(funs);
                path.replaceWithMultiple(es5func);
            }
        }
    }
}
let d = babel.transform(code, {
    plugins: [
        ClassPlugin
    ]
})
console.log(d.code);

```

3、实现模块的按需加载

eg:

https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2018/7/24/164cb72bdc7385c2~tplv-t2oaga2asx-image.image

https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2018/7/24/164cb702df6de2f8~tplv-t2oaga2asx-image.image

https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2018/7/24/164cb6e01016d3c9~tplv-t2oaga2asx-image.image

```
//babel-plugin-固定的前缀，放在node_module里
//babel-plugin-czq-import
const babel = require('babel-core');//babel核心解析库
const t = require('babel-types');//babel类型转化库
let code = `import {Button, ALert} from 'antd'`;
let importPlugin = {
    visitor: {
        ImportDeclaration(path){
            let {node} = path;
            //console.log(node);
            let source = node.source.value;
            let specifiers =  node.specifiers;
            if(!t.isImportDefaultSpecifier(specifiers[0])){
                specifiers = specifiers.map(specifier=>{
                    return t.importDeclaration(
                        [t.importDefaultSpecifier(specifier.local)],
                        t.stringLiteral(`${source}/lib/${specifier.local.name.toLowerCase()}`)
                    )
                });
                path.replaceWithMultiple(specifiers);
            }
        }
    }
}
let r = babel.transform(code, {
    plugins: [
        importPlugin
    ]
})

module.exports = importPlugin;

```

最后的测试

安装依赖：

```
npm antd babel-preset-env babel-preset-react react react-dom webpack webpack-cli --save-dev

```

测试代码：

```
//test.js
import React from 'react';
import ReactDOM from 'react-dom';

import {Button} from 'antd';

```

测试：

```
npx webpack

```

用babel-plugin-czq-import前后的效果对比：

前：

https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2018/7/24/164cb6e0df2b1511~tplv-t2oaga2asx-image.image

后：

https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2018/7/24/164cb6e29d7e12d6~tplv-t2oaga2asx-image.image

原文：[从AST编译解析谈到写babel插件](https://github.com/Zenquan/blog/issues/13),欢迎star，欢迎交流。

项目地址[babelPlugin](https://github.com/Zenquan/babelPlugin)

参考地址：

[esprima官网](http://esprima.org/)

[babel在github上的文档](https://github.com/babel/babel/tree/6.x/packages/babel-types)