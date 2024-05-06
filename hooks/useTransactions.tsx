import { getTransactionsFromIndexer } from "@/services/transactions"
import { useTransactionsStore } from "@/stores/transactionsStore"
import { Chain } from "@/types/common"
import { Transaction } from "@/types/transaction"
import { useMemo } from "react"

/**
 * @description All the functionalities related to substrate wallet such as connecting, switching network, etc
 */
export default function useTransactions() {
    const {
        indexedTransactions,
        localTransactions,
        setIndexedTransactions,
        addLocalTransaction,
        deleteLocalTransaction
    } = useTransactionsStore()

    // Fetch transactions from indexer
    const fetchTransactions = async ({
        userAddress,
        sourceChain,
        destinationChain
    }: {
        userAddress: string,
        sourceChain: string,
        destinationChain: string

    }) => {
        // Fetch all transactions
        const indexedTransactions = await getTransactionsFromIndexer(userAddress, sourceChain, destinationChain)
        setIndexedTransactions(indexedTransactions)
    }

    // allTransactions = indexedTransactions + localTransactions
    const allTransactions: Transaction[] = useMemo(() => {
        /**
         * Merge indexedTransactions and localTransactions
         * if local transaction is already indexed, delete it from localTransactions
         * else add it to allTransactions
         * but deleting will create circular dependency, hence leave it as it is
         */
        const allTransactions: Transaction[] = []

        localTransactions.forEach((localTxn) => {
            const indexedTxn = indexedTransactions.find((indexedTxn) => {
                if (indexedTxn.sourceChain === Chain.ETH) {
                    return indexedTxn.sourceTransactionHash.toLowerCase() === localTxn.sourceTransactionHash.toLowerCase()
                } else if (indexedTxn?.sourceChain === Chain.AVAIL) {
                    return indexedTxn.sourceBlockHash.toLowerCase() === localTxn.sourceBlockHash.toLowerCase()
                }
            }
            )
            if (!indexedTxn) {
                allTransactions.push(localTxn)
            }
        })

        allTransactions.push(...indexedTransactions)

        return allTransactions
    }, [indexedTransactions, localTransactions])

    const pendingTransactions: Transaction[] = useMemo(() => {
        return allTransactions.filter((txn) => txn.status !== "CLAIMED")
    }, [allTransactions])

    const completedTransactions: Transaction[] = useMemo(() => {
        return allTransactions.filter((txn) => txn.status === "CLAIMED")
    }, [allTransactions])

    const addToLocalTransaction = (transaction: Transaction) => {
        addLocalTransaction(transaction)
    }

    return {
        allTransactions,
        pendingTransactions,
        completedTransactions,
        fetchTransactions,
        addToLocalTransaction
    }
}
