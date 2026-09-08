# Wooly 文档

当前使用与测试入口见[中文 README](../README.md)和 [English README](README.en.md)。

| 文档 | 内容 |
| --- | --- |
| [01-data-model](01-data-model.md) | 家庭成员、权益账户、核销与积分模型 |
| [02-mvvm-architecture](02-mvvm-architecture.md) | Model / ViewModel / View 分工 |
| [03-pages-and-ui](03-pages-and-ui.md) | 页面与交互设计 |
| [04-mock-data](04-mock-data.md) | 测试与界面研究使用的样例数据 |
| [05-cycle-engine](05-cycle-engine.md) | 权益周期计算 |
| [06-implementation-plan](06-implementation-plan.md) | 早期实现计划 |
| [07-ui-design-audit](07-ui-design-audit.md) | UI 调整过程与截图方法 |
| [08-development](08-development.md) | 当前 Worker / D1 初始化与部署入口 |
| [Logo](../assets/brand/README.md) | Logo 资源及使用 |

01–07 保留了当时的设计与实现过程，部分字段和状态已演进。当前持久化通过 Next.js → Worker → D1，示例数据用于测试和界面研究。
