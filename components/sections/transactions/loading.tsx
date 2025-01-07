import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableCell, TableRow, Table } from "@/components/ui/table";
import { Clock, MoveRight } from 'lucide-react';

export default function TxnLoading() {
  return (
    <Table className="flex h-[85%] pb-12 pt-2">
      <TableBody className="overflow-y-scroll min-w-[99%] mx-auto space-y-2.5">
        {Array(4).fill(null).map((_, index) => (
          <TableRow 
            key={`skeleton-${index}`}
            className="flex overflow-x-scroll flex-row justify-between w-[100%] bg-[#363b4f] rounded-xl p-2"
          >
            <TableCell className="font-medium flex flex-row items-start gap-4 rounded-xl">
              {/* Date */}
              <div className="flex flex-col items-center">
                <Skeleton className="h-4 w-6 mb-1" />
                <Skeleton className="h-4 w-8" />
              </div>

              <div className="flex flex-col gap-2">
                {/* Amount */}
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </div>

                {/* Chain flow */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-6 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <MoveRight className="text-gray-500" />
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-6 rounded-full" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>

                {/* More details */}
                <Skeleton className="h-4 w-24" />
              </div>
            </TableCell>

            <TableCell className="flex flex-col items-end justify-between py-2">
              {/* Status */}
              <Skeleton className="h-6 w-28 rounded-lg" />
              {/* Time */}
              <div className="flex items-center gap-1">
                <Skeleton className="h-4 w-16" />
                <Clock className="w-4 h-4 text-gray-500" />
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

