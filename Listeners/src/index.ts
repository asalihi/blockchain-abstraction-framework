import { InitializeEthereumContractListener, ShutdownEthereumContractListener } from "./ethereum-listener";
import { InitializeFabricContractListener, ShutdownFabricContractListener } from "./fabric-listener";
import { RegisterProcessShutdownListener, Shutdown, SHUTDOWN_SIGNALS, FORCE_EXIT_FUNCTION } from "./helpers";

async function Initialize(): Promise<void> {
    try {
        console.log('SMART CONTRACT LISTENERS');
        console.log('************************');
        RegisterShutdownEvents();
        RegisterShutdownListeners();

        console.log('Initializing Fabric contract listener...');
		await InitializeFabricContractListener();
		console.log('Fabric contract listener initialized successfully');
		console.log('Initialize Ethereum contract listener...');
		await InitializeEthereumContractListener();
		console.log('Ethereum contract listener initialized successfully');
    } catch(error) {
        console.error('AN ERROR OCCURRED DURING INITIALIZATION');
		console.error(error);
		return await Shutdown();
    }
}

function RegisterShutdownEvents(): void {
    SHUTDOWN_SIGNALS.forEach((signal: NodeJS.Signals) => {
        process.on(signal, FORCE_EXIT_FUNCTION());
        process.on(signal, Shutdown);
    });

    process.on('beforeExit', FORCE_EXIT_FUNCTION());
    process.on('beforeExit', Shutdown);
}

function RegisterShutdownListeners(): void {
	RegisterProcessShutdownListener('ethereum contract listener shutdown', async () => ShutdownEthereumContractListener());
	RegisterProcessShutdownListener('fabric contract listener shutdown', async () => ShutdownFabricContractListener());
}

Initialize();