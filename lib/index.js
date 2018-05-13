require('events').EventEmitter.defaultMaxListeners = 100; // eslint-disable-line
const constants = require('./constants')
const inquirer = require('inquirer')
const request = require('request-promise-native')
const readlineSync = require('readline-sync')
const ora = require('ora')
const chalk = require('chalk')
const terminalImage = require('terminal-image')

const stdin = process.openStdin()
const log = console.log // eslint-disable-line no-console

const mediumModule = (() => {
  const postsList = []
  const postsListContent = []
  let spinner
  let topic
  let order = 1
  let page = 1
  const clearScreen = () => process.stdout.write('\x1Bc')

  const print = async (msg, type) => {
    switch (type) {
      case 8:
        log(chalk.bgRgb(100, 100, 100).inverse(msg))
        break
      case 4:
        log(await terminalImage.url(`https://cdn-images-1.medium.com/max/${msg.originalWidth}/${msg.id}`))
        break
      case 3:
        log()
        log(chalk.yellowBright(constants.SYMBOL.TITLE + msg))
        break
      case 1:
        log(msg)
        break
      case 9:
        log(chalk.redBright(constants.SYMBOL.LIST) + msg)
        log()
        break
      case 'err':
        log(chalk.redBright(' Sry ') + msg)
        log()
        break
      case 'bye':
        log()
        log(chalk.greenBright(msg))
        break
      case 'hint':
        log()
        log(chalk.black(chalk.bgWhite(msg)))
        break
      default :
        break
    }
  }

  const handleError = err => print(err, 'Err')
  const getPostById = async (postId) => {
    try {
      const dirtyResponse = await request(`${constants.MEDIUM.URL_GET_ONE_POST}${postsList[postId]}`)
      const stringCleanResponse = dirtyResponse.split(constants.MEDIUM.RESPONSE_SPLITER)[1]
      const { success, payload } = JSON.parse(stringCleanResponse)

      if (success) {
        const content = payload.value.content.bodyModel.paragraphs
        for (let key in content) {
          const msg = content[key].type === 4 ? content[key].metadata : content[key].text
          await print(msg, content[key].type)
        }
      }
    } catch (err) {
      handleError(err)
    }

    stdin.resume()
    stdin.setRawMode(true)
    print(constants.TEXT.MSG_HIT_BACKSPACE_TO_GO_BACK, 'hint')
  }

  const showArticleList = () => {
    clearScreen()
    const questions = {
      pageSize: 10,
      name: 'content',
      message: chalk.cyan.bold(constants.TEXT.BTN_ENTER) + chalk.reset(constants.TEXT.MSG_CHOOSE_POST) + chalk.redBright(' | ') + chalk.cyan.bold(constants.TEXT.BTN_SPACE) + chalk.reset(constants.TEXT.MSG_GET_MORE_POSTS) + chalk.redBright(' | ') + chalk.cyan.bold(constants.TEXT.BTN_ESC) + chalk.reset(`${constants.TEXT.MSG_EXIT}\n\n`) + chalk.bgWhite.black(`${postsList.length + constants.TEXT.MSG_LOADED_STORIES}\n\n`),
      type: 'list',
      choices: postsListContent
    }
    const prompt = inquirer.createPromptModule()
    prompt(questions)
      .then(response => getPostById(postsListContent.indexOf(response.content)))
      .catch(err => handleError(err))
  }

  const readSomeStories = async (searchWord) => {
    spinner = ora(constants.TEXT.MSG_SPINNER_GETTING_ARTICLES + chalk.greenBright(topic)).start()
    clearScreen()
    const options = {
      headers: {
        accept: 'application/json'
      }
    }
    const dirtyResponse = await request(`${constants.MEDIUM.URL_SEARCH}${searchWord}`, options)
    const stringCleanResponse = dirtyResponse.split(constants.MEDIUM.RESPONSE_SPLITER)[1]
    const { success, payload } = JSON.parse(stringCleanResponse)
    if (success) {
      const posts = payload.references.Post
      spinner.succeed(constants.TEXT.MSG_SPINNER_SUCCESS_SEARCH)
      Object.keys(posts).forEach((id) => {
        postsList.push(posts[id].id)
        postsListContent.push(`${chalk.yellowBright(`[${order}] `) + posts[id].title} - ${chalk.greenBright(`${Math.round(posts[id].virtuals.readingTime)}min`)} - ${chalk.redBright(constants.SYMBOL.LIKE + posts[id].virtuals.recommends)}`)
        order += 1
      })
      showArticleList(postsListContent)
    }
  }

  const getMoreArticles = async () => {
    log()
    spinner = ora(chalk.blueBright(constants.TEXT.MSG_LOADING_ARTICLES)).start()
    page += 1
    const dirtyResponse = await request({
      method: 'POST',
      uri: `${constants.MEDIUM.URL_GET_POSTS}${topic}`,
      headers: {
        accept: 'application/json',
        'x-xsrf-token': 1
      },
      json: true,
      body: {
        ignoredIds: postsList,
        page
      }
    })
    const stringCleanResponse = dirtyResponse.split(constants.MEDIUM.RESPONSE_SPLITER)[1]
    const { success, payload } = JSON.parse(stringCleanResponse)
    if (success) {
      const posts = payload.value
      Object.keys(posts).forEach((id) => {
        postsList.push(posts[id].id)
        postsListContent.push(`${chalk.yellowBright(`[${order}] `) + posts[id].title} - ${chalk.cyanBright(`${Math.round(posts[id].virtuals.readingTime)}min`)} - ${chalk.redBright(`♥${posts[id].virtuals.recommends}`)}`)
        order += 1
      })
      spinner.stop()
      showArticleList(postsListContent)
    }
  }

  const start = () => {
    stdin.on('keypress', (chunk, key) => {
      if (key && key.name === 'backspace') { showArticleList() } else if (key && key.name === 'space') { getMoreArticles() } else if (key && key.name === 'escape') {
        print('See you soon, bye!', 'bye')
        process.exit()
      }
    })
    clearScreen()
    topic = readlineSync.question(constants.TEXT.SEARCH_QUESTION)
    readSomeStories(topic)
  }

  return {
    start
  }
})()

mediumModule.start()
