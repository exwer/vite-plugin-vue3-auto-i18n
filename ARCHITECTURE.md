# i18ncraft 架构文档

## 概述

i18ncraft 是一个现代化的国际化工具，支持 Vue 和 React 项目的自动文本提取和转换。本文档描述了重构后的代码架构。

## 架构概览

```
src/
├── core/                    # 核心功能
│   ├── transform.ts        # 主要转换逻辑（保持向后兼容）
│   ├── transformer/        # 新的转换器架构
│   │   ├── base.ts         # 基础转换器抽象类
│   │   ├── vue.ts          # Vue专用转换器
│   │   ├── react.ts        # React专用转换器
│   │   └── index.ts        # 转换器入口
│   └── middleware/         # 中间件系统
│       ├── index.ts        # 中间件管理器
│       └── builtin.ts      # 内置中间件
├── config/                 # 配置管理
│   ├── index.ts           # 配置管理器
│   ├── types.ts           # 配置类型定义
│   ├── defaults.ts        # 默认配置
│   └── validator.ts       # 配置验证
├── cli/                   # CLI工具
│   └── index.ts           # 新的CLI类
├── plugins/               # 构建工具插件
├── utils/                 # 工具函数
└── types/                 # 类型定义
```

## 核心组件

### 1. 转换器架构 (Transformer Architecture)

新的转换器架构提供了更好的扩展性和可维护性：

#### BaseTransformer
- 抽象基类，定义了转换器的基本接口
- 提供通用的转换流程：解析 → 转换 → 生成
- 支持错误处理和上下文管理

#### VueTransformer
- 专门处理 Vue SFC 文件
- 继承自 BaseTransformer
- 支持模板和脚本的分别转换

#### ReactTransformer
- 专门处理 React JSX 文件
- 使用 Babel 进行 AST 转换
- 支持 JSX 语法和 TypeScript

### 2. 中间件系统 (Middleware System)

中间件系统提供了强大的扩展能力：

#### 中间件接口
```typescript
interface TransformMiddleware {
  name: string
  before?: (source: string, options: TransformOptions) => string | Promise<string>
  after?: (result: TransformResult, options: TransformOptions) => TransformResult | Promise<TransformResult>
  priority?: number
}
```

#### 内置中间件
- **performanceMiddleware**: 性能监控
- **loggingMiddleware**: 日志记录
- **errorHandlingMiddleware**: 错误处理
- **formattingMiddleware**: 代码格式化
- **statisticsMiddleware**: 统计信息
- **cacheMiddleware**: 缓存支持

#### 使用示例
```typescript
import { useMiddleware, performanceMiddleware } from 'i18ncraft'

// 注册中间件
useMiddleware(performanceMiddleware)

// 自定义中间件
useMiddleware({
  name: 'custom',
  before: (source, options) => {
    // 预处理逻辑
    return source
  },
  after: (result, options) => {
    // 后处理逻辑
    return result
  }
})
```

### 3. 配置管理 (Configuration Management)

#### ConfigManager
- 统一的配置管理
- 支持配置验证
- 提供默认值
- 类型安全的配置访问

#### 配置验证
- 自动验证必需字段
- 类型检查
- 文件路径验证
- 自定义验证规则

### 4. CLI工具 (CLI Tool)

#### I18nCraftCLI
- 现代化的CLI类
- 支持批量文件处理
- 内置中间件集成
- 详细的统计信息

## 性能优化

### 1. 缓存机制
- 匹配结果缓存
- 避免重复的locale搜索
- 内存友好的缓存策略

### 2. 中间件优化
- 按优先级执行
- 异步处理支持
- 错误隔离

### 3. 文件处理优化
- 流式处理大文件
- 并行处理支持
- 内存使用优化

## 扩展性

### 1. 自定义转换器
```typescript
import { BaseTransformer } from 'i18ncraft'

class CustomTransformer extends BaseTransformer {
  protected parse(): any {
    // 自定义解析逻辑
  }
  
  protected transformAST(ast: any): any {
    // 自定义转换逻辑
  }
  
  protected generate(result: any): string {
    // 自定义生成逻辑
  }
}
```

### 2. 自定义中间件
```typescript
import { TransformMiddleware } from 'i18ncraft'

const customMiddleware: TransformMiddleware = {
  name: 'custom',
  priority: 5,
  before: (source, options) => {
    // 预处理逻辑
    return source
  },
  after: (result, options) => {
    // 后处理逻辑
    return result
  }
}
```

### 3. 自定义配置验证
```typescript
import { ConfigManager } from 'i18ncraft'

const configManager = new ConfigManager({
  // 自定义验证规则
  customValidator: (config) => {
    // 验证逻辑
    return { valid: true, errors: [], warnings: [] }
  }
})
```

## 向后兼容性

重构后的架构保持了完全的向后兼容性：

- 原有的 `transformSFC` 函数继续工作
- 插件系统保持不变
- API 接口保持一致
- 测试用例全部通过

## 迁移指南

### 从旧版本迁移
1. 更新导入路径（如果需要）
2. 使用新的配置管理器（可选）
3. 利用中间件系统扩展功能（可选）

### 新功能使用
1. 使用新的CLI类进行批量处理
2. 注册自定义中间件
3. 创建自定义转换器

## 最佳实践

### 1. 性能优化
- 使用缓存中间件
- 合理设置中间件优先级
- 避免在中间件中进行重计算

### 2. 错误处理
- 使用错误处理中间件
- 提供有意义的错误信息
- 实现优雅的错误恢复

### 3. 扩展开发
- 遵循转换器接口
- 使用类型安全的配置
- 编写完整的测试用例

## 未来规划

### 1. 功能增强
- 支持更多文件格式
- 增强的AST操作
- 更好的TypeScript支持

### 2. 性能提升
- WebAssembly支持
- 并行处理优化
- 更智能的缓存策略

### 3. 生态系统
- 插件市场
- 社区贡献指南
- 更多示例和文档 
