FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY server/NotVarMi.Api/NotVarMi.Api.csproj server/NotVarMi.Api/
RUN dotnet restore server/NotVarMi.Api/NotVarMi.Api.csproj
COPY server/NotVarMi.Api/ server/NotVarMi.Api/
RUN dotnet publish server/NotVarMi.Api/NotVarMi.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_HTTP_PORTS=8080
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "NotVarMi.Api.dll"]
