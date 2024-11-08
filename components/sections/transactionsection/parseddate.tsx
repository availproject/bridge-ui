import { parseDateTimeToDay, parseDateTimeToMonthShort } from "@/utils/parsers";

export default function ParsedDate({
    sourceTimestamp,
  }: {
    sourceTimestamp: string;
  }) {
    return (
      <span className="flex md:flex-col flex-row items-center justify-center mr-4  ">
        <span className="text-white text-opacity-60 flex md:flex-col flex-row space-x-1 items-center justify-center ml-2">
          <p className="text-white">
            {parseDateTimeToDay(sourceTimestamp)}
          </p>
          <p className=" text-xs">
            {parseDateTimeToMonthShort(sourceTimestamp)}
          </p>
        </span>
      </span>
    );
  }