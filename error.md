🎮 completeGameSingleTransaction: Submitting single transaction...
CircleService.ts:638 ❌ completeGameSingleTransaction failed, falling back: UserOperationExecutionError: Execution reverted with reason: Insufficient balance.

Request Arguments:
callData: 0xb61d27f6000000000000000000000000d9aeca6c00f52e17f9296a8c490d7f0ff80f6be80000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000000444825c180000000000000000000000000c1ab80675455ee863bccd16045635bf7ab0850020000000000000000000000000000000000000000000000012a5f58168ee6000000000000000000000000000000000000000000000000000000000000
callGasLimit: 0
maxFeePerGas: 89.878300458 gwei
maxPriorityFeePerGas: 89.878300308 gwei
nonce: 32405301306468036231126702882816
paymaster: 0x03df76c8c30a88f424cf3cbbc36a1ca02763103b
paymasterData: 0x0000000000000000000000000000000000000000000000000000000063b0db100000000000000000000000000000000000000000000000000000000063b0db1079ea5b5abe145674ae48e0bc9845b3c1f97fd2119ee3bbb912d8c941f7e75b70313aa3006ce284dc8941941c699fdc2602cabfee5b36a92e9590379c6c6defc71b
paymasterPostOpGasLimit: 3000
paymasterVerificationGasLimit: 100000
preVerificationGas: 0
sender: 0xc1ab80675455ee863bccd16045635bf7ab085002
signature: 0x0000be58786f7ae825e097256fc83a4749b95189e03e9963348373e9c595b15200000000000000000000000000000000000000000000000000000000000000412200000000000000000000000000000000000000000000000000000000000002400000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000006091077742edaf8be2fa866827236532ec2a5547fe2721e606ba591d1ffae7a15c022e5f8fe5614bbf65ea23ad3781910eb04a1a60fae88190001ecf46e5f5680a00000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000000001700000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000002549960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d9763050000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000867b2274797065223a22776562617574686e2e676574222c226368616c6c656e6765223a224b6d62474d316a4d554b57794d6352414c6774553953537144384841744867486178564b6547516b503541222c226f726967696e223a22687474703a2f2f6c6f63616c686f73743a35313733222c2263726f73734f726967696e223a66616c73657d0000000000000000000000000000000000000000000000000000
verificationGasLimit: 100000

Details: Insufficient balance
Version: viem@2.36.0
at getUserOperationError (chunk-46QZM3J4.js?v=9289111f:5353:10)
at estimateUserOperationGas (chunk-46QZM3J4.js?v=9289111f:5806:11)
at async prepareUserOperation (chunk-46QZM3J4.js?v=9289111f:5733:19)
at async sendUserOperation (chunk-46QZM3J4.js?v=9289111f:5889:29)
at async CircleService.completeGameSingleTransaction (CircleService.ts:616:20)
at async CircleService.completeGame (CircleService.ts:584:14)
at async completeCurrentGame (GameContext.tsx:417:22)
at async BikeRunner.tsx:894:7Caused by: ExecutionRevertedError: Execution reverted with reason: Insufficient balance.

Details: Insufficient balance
Version: viem@2.36.0
at getBundlerError (chunk-46QZM3J4.js?v=9289111f:5290:14)
at chunk-46QZM3J4.js?v=9289111f:5344:20
at getUserOperationError (chunk-46QZM3J4.js?v=9289111f:5352:5)
at estimateUserOperationGas (chunk-46QZM3J4.js?v=9289111f:5806:11)
at async prepareUserOperation (chunk-46QZM3J4.js?v=9289111f:5733:19)
at async sendUserOperation (chunk-46QZM3J4.js?v=9289111f:5889:29)
at async CircleService.completeGameSingleTransaction (CircleService.ts:616:20)
at async CircleService.completeGame (CircleService.ts:584:14)
at async completeCurrentGame (GameContext.tsx:417:22)
at async BikeRunner.tsx:894:7Caused by: UnknownRpcError: An unknown RPC error occurred.

Details: Insufficient balance
Version: viem@2.36.0
at withRetry.delay.count.count (chunk-6UHYJ5VK.js?v=9289111f:4184:19)
at async attemptRetry (chunk-6UHYJ5VK.js?v=9289111f:604:22)Caused by: ProviderRpcError: Insufficient balance
at fetchFromApi (@circle-fin_modular-wallets-core.js?v=9289111f:31552:11)
at async ModularWalletsProvider.request (@circle-fin_modular-wallets-core.js?v=9289111f:31232:26)
at async withRetry.delay.count.count (chunk-6UHYJ5VK.js?v=9289111f:4096:16)
at async attemptRetry (chunk-6UHYJ5VK.js?v=9289111f:604:22)
completeGameSingleTransaction @ CircleService.ts:638
await in completeGameSingleTransaction
completeGame @ CircleService.ts:584
completeCurrentGame @ GameContext.tsx:417
(anonymous) @ BikeRunner.tsx:894
(anonymous) @ BikeRunner.tsx:845
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857
requestAnimationFrame
(anonymous) @ BikeRunner.tsx:857Understand this error
CircleService.ts:650 🎮 completeGameWithSession: Using simplified session approach...
GameContext.tsx:447 🎉 Game completed successfully! Rewards were auto-claimed to your wallet.
CircleService.ts:211 💰 getRaceTokenBalance: Checking RACE token balance for: 0xc1ab80675455ee863bccd16045635bf7ab085002
CircleService.ts:231 💰 getRaceTokenBalance: Raw balance: 73625000000000000000n Formatted: 73.625
GameContext.tsx:441 💰 Updated wallet RACE balance: 73.625
