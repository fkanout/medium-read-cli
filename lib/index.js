'use strict';
require('events').EventEmitter.defaultMaxListeners = 100;
const constants = require('./constants');
const inquirer = require('inquirer');
const request = require('request-promise-native');
const readlineSync = require('readline-sync');
const ora = require('ora');
const chalk = require('chalk');
const stdin = process.openStdin(); 
const log = console.log;
const postsList = [];
const postsListContent =[];
let spinner;
let topic;
let order = 1;
let page = 1;


 
const readSomeStories = async (searchWord)=>{
  spinner = ora(constants.TEXT.MSG_SPINNER_GETTING_ARTICLES + chalk.greenBright(topic)).start();
  clearScreen();
  const options = {
    headers:{
        accept: 'application/json'
    }
  } 
  const dirtyResponse = await request(`${constants.MEDIUM.URL_SEARCH}${searchWord}`, options);
  const stringCleanResponse = dirtyResponse.split(constants.MEDIUM.RESPONSE_SPLITER)[1];
  const { success, payload  } = JSON.parse(stringCleanResponse)
  if (success){
    const posts = payload.references.Post;
    spinner.succeed(constants.TEXT.MSG_SPINNER_SUCCESS_SEARCH)
    for(let id in posts){
      postsList.push(posts[id].id);
      postsListContent.push(chalk.yellowBright('[' + order + '] ' ) + posts[id].title + ' - ' + chalk.greenBright(Math.round(posts[id].virtuals.readingTime) + 'min') + ' - ' + chalk.redBright('♥' + posts[id].virtuals.recommends))
      order++;
    }
    showArticlList(postsListContent);
  }
}

const getMoreArticles = async () =>{
  log();
  spinner = ora(chalk.blueBright(constants.TEXT.MSG_LOADING_ARTICLES)).start();
  page ++;
  const dirtyResponse = await request({
    method: 'POST',
    uri: `${constants.MEDIUM.URL_GET_POSTS}${topic}`,
    headers: {
      'accept': 'application/json',
      'x-xsrf-token': 1
    },
    json: true,
    body: {
      ignoredIds: postsList,
      page,
    }
  });
  const stringCleanResponse = dirtyResponse.split(constants.MEDIUM.RESPONSE_SPLITER)[1];
  const { success, payload  } = JSON.parse(stringCleanResponse)
  if (success){
    const posts = payload.value;
    for(let id in posts){
      postsList.push(posts[id].id);
      postsListContent.push(chalk.yellowBright('[' + order + '] ' ) + posts[id].title + ' - ' + chalk.cyanBright(Math.round(posts[id].virtuals.readingTime) + 'min') + ' - ' + chalk.redBright('♥' + posts[id].virtuals.recommends))
      order++;
    }
    spinner.stop();
    showArticlList(postsListContent);
  }
}

const getPostById = (postId) =>{
  request(`${constants.MEDIUM.URL_GET_ONE_POST}${postsList[postId]}`).then(dirtyResponse=>{
    const stringCleanResponse = dirtyResponse.split(constants.MEDIUM.RESPONSE_SPLITER)[1];
    const { success, payload  } = JSON.parse(stringCleanResponse)
    if (success){
      const content = payload.value.content.bodyModel.paragraphs;
      for(let id in content)
        print(content[id].text, content[id].type);
      stdin.resume();
      stdin.setRawMode(true);
    }
  });
}


const start = ()=>{ 
  clearScreen();
  topic = readlineSync.question(constants.TEXT.SEARCH_QUESTION);
  readSomeStories(topic);
}

const print = (msg, type) => {
  switch (type){
    case 3:
      log();
      log(chalk.yellowBright('‣ ' + msg));
      break;
    case 1:
      log(msg);
      break;
    case 9:
      log(chalk.redBright(' • ') + msg)
      log();
      break;
    case 'err':
      log(chalk.redBright(' Sry ') + msg)
      log();
      break;
    case 'bye':
      log();
      log(chalk.greenBright(msg))
      break;
  }
}

const showArticlList = () =>{
  clearScreen();
  
  const questions ={
    pageSize: 10,
    name: 'content',
    message: chalk.cyan.bold ('ENTER: ') + chalk.reset('Pick one') + chalk.redBright(' | ') + chalk.cyan.bold ('SPACE: ') + chalk.reset('Load more') + chalk.redBright(' | ') + chalk.cyan.bold('ESC: ') + chalk.reset('exit\n\n') + chalk.bgWhite.black(postsList.length + ' arcticles loaded. \n\n'),
    type: 'list',
    choices: postsListContent
  }
  const prompt = inquirer.createPromptModule();
  prompt(questions).then(response => getPostById(postsListContent.indexOf(response.content)));
}
const clearScreen = () => process.stdout.write('\x1Bc');


stdin.on('keypress', function (chunk, key) {
  if (key && key.name == 'backspace') { showArticlList(); }
  else if (key && key.name == 'space') { getMoreArticles(); }
  else if (key && key.name == 'escape') { 
    print('See you soon, bye!', 'bye')
    process.exit(); 
  }
});

exports.start = start;