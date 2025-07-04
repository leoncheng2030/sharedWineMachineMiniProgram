const { exec, spawn } = require('child_process')
const path = require('path')
const fs = require('fs')
const chokidar = require('chokidar')

// 配置
const config = {
  // 微信开发者工具CLI路径 (Windows)
  cliPath: 'C:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat',
  // 项目路径
  projectPath: path.resolve(__dirname, '../'),
  // 真机调试端口
  port: 9420,
  // 自动预览
  autoPreview: true,
  // 编译模式
  compileType: 'miniProgram'
}

class MiniProgramDevServer {
  constructor() {
    this.isConnected = false
    this.watcher = null
    this.compileTimer = null
  }

  // 启动真机调试
  async startRemoteDebug() {
    try {
      console.log('🚀 正在启动微信开发者工具真机调试...')
      
      // 构建CLI命令
      const command = [
        config.cliPath,
        '--auto',
        `"${config.projectPath}"`,
        '--auto-port',
        config.port.toString(),
        '--compile-type',
        config.compileType
      ].join(' ')

      console.log('📝 执行命令:', command)

      // 启动开发者工具
      const child = spawn(command, {
        shell: true,
        stdio: 'inherit'
      })

      child.on('error', (error) => {
        console.error('❌ 启动失败:', error)
      })

      child.on('close', (code) => {
        console.log(`🔚 进程退出，代码: ${code}`)
      })

      // 等待工具启动
      await this.waitForToolReady()
      
      console.log('✅ 微信开发者工具已启动')
      console.log('📱 请在手机微信中扫描二维码开始真机调试')
      console.log('🔄 代码修改后将自动同步到真机')
      
      // 启动文件监听
      this.startFileWatcher()
      
      this.isConnected = true
      
    } catch (error) {
      console.error('❌ 启动真机调试失败:', error)
      throw error
    }
  }

  // 等待工具就绪
  async waitForToolReady() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, 5000)
    })
  }

  // 启动文件监听
  startFileWatcher() {
    console.log('👀 开始监听文件变化...')
    
    // 监听的文件类型
    const watchPatterns = [
      path.join(config.projectPath, 'src/**/*.vue'),
      path.join(config.projectPath, 'src/**/*.js'),
      path.join(config.projectPath, 'src/**/*.ts'),
      path.join(config.projectPath, 'src/**/*.scss'),
      path.join(config.projectPath, 'src/**/*.css'),
      path.join(config.projectPath, 'src/**/*.json'),
      path.join(config.projectPath, 'src/**/*.wxml'),
      path.join(config.projectPath, 'src/**/*.wxss')
    ]

    this.watcher = chokidar.watch(watchPatterns, {
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/unpackage/**',
        '**/.git/**',
        '**/test/**'
      ],
      persistent: true,
      ignoreInitial: true
    })

    this.watcher
      .on('change', (filePath) => {
        console.log(`📝 文件变化: ${path.relative(config.projectPath, filePath)}`)
        this.triggerCompile('文件修改')
      })
      .on('add', (filePath) => {
        console.log(`➕ 新增文件: ${path.relative(config.projectPath, filePath)}`)
        this.triggerCompile('新增文件')
      })
      .on('unlink', (filePath) => {
        console.log(`🗑️ 删除文件: ${path.relative(config.projectPath, filePath)}`)
        this.triggerCompile('删除文件')
      })
      .on('error', (error) => {
        console.error('❌ 文件监听错误:', error)
      })
  }

  // 触发编译
  triggerCompile(reason) {
    // 防抖处理，避免频繁编译
    if (this.compileTimer) {
      clearTimeout(this.compileTimer)
    }

    this.compileTimer = setTimeout(() => {
      this.compile(reason)
    }, 300) // 300ms 防抖
  }

  // 执行编译
  async compile(reason) {
    try {
      console.log(`🔄 开始编译 (${reason})...`)
      
      // 使用CLI触发编译
      const compileCommand = [
        config.cliPath,
        '--build-npm',
        `"${config.projectPath}"`
      ].join(' ')

      exec(compileCommand, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ 编译失败:', error)
          return
        }
        
        if (stderr) {
          console.warn('⚠️ 编译警告:', stderr)
        }
        
        console.log('✅ 编译完成，已同步到真机')
        
        // 如果启用自动预览，触发预览
        if (config.autoPreview) {
          this.triggerPreview()
        }
      })
      
    } catch (error) {
      console.error('❌ 编译过程出错:', error)
    }
  }

  // 触发预览
  triggerPreview() {
    const previewCommand = [
      config.cliPath,
      '--preview',
      `"${config.projectPath}"`
    ].join(' ')

    exec(previewCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ 预览失败:', error)
        return
      }
      console.log('📱 预览已更新')
    })
  }

  // 停止服务
  async stop() {
    console.log('🛑 正在停止真机调试服务...')
    
    if (this.watcher) {
      await this.watcher.close()
      this.watcher = null
    }
    
    if (this.compileTimer) {
      clearTimeout(this.compileTimer)
      this.compileTimer = null
    }
    
    this.isConnected = false
    console.log('✅ 真机调试服务已停止')
  }

  // 获取状态
  getStatus() {
    return {
      isConnected: this.isConnected,
      isWatching: !!this.watcher,
      projectPath: config.projectPath,
      port: config.port
    }
  }
}

// 创建服务实例
const devServer = new MiniProgramDevServer()

// 启动服务
async function start() {
  try {
    await devServer.startRemoteDebug()
    
    // 监听退出信号
    process.on('SIGINT', async () => {
      console.log('\n🛑 收到退出信号...')
      await devServer.stop()
      process.exit(0)
    })
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 收到终止信号...')
      await devServer.stop()
      process.exit(0)
    })
    
  } catch (error) {
    console.error('❌ 启动失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  start()
}

module.exports = {
  MiniProgramDevServer,
  start,
  config
}