import { repl } from '@nestjs/core';
import { AppModule } from './app.module';

declare const module: any;

async function bootstrap() {
    await repl(AppModule);

    if (module.hot) {
        module.hot.accept();
        module.hot.dispose(() => repl.call('process.exit()'));
    }
}

bootstrap();
